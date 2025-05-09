import {
  Box,
  Grid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardBody,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  Progress,
  Image,
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWorkouts } from '../hooks/useWorkouts'
import { calculateAge } from './Profile'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'
import { useState, useRef } from 'react'
import React from 'react'

export function Dashboard() {
  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const { workouts, isLoading: workoutsLoading } = useWorkouts()

  // Find today's or next workout
  const today = new Date().toISOString().slice(0, 10)
  let nextWorkout = null
  if (workouts && workouts.length > 0) {
    nextWorkout = workouts.find(w => w.date === today)
    if (!nextWorkout) {
      // Find next future workout
      nextWorkout = workouts.filter(w => w.date > today).sort((a, b) => a.date.localeCompare(b.date))[0]
    }
  }

  // Mock stats for graph
  const statsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Workouts',
        data: [1, 2, 1, 0, 2, 1, 0],
        backgroundColor: 'rgba(66, 153, 225, 0.6)',
      },
    ],
  }

  // Mock coach and milestones
  const coachName = 'Coach Carter'
  const milestones = [
    'Team won regional championship',
    '5 athletes qualified for nationals',
    'New school record in 4x400m relay',
  ]

  // --- Exercise Execution State (copied from Workouts) ---
  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as any,
    exerciseIdx: 0,
    timer: 0,
    running: false,
  })
  const [todayProgressIdx, setTodayProgressIdx] = useState(0)
  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset progress if workout changes
  React.useEffect(() => {
    setTodayProgressIdx(0)
  }, [nextWorkout?.id])

  // Timer logic
  React.useEffect(() => {
    if (execModal.isOpen && execModal.running) {
      timerRef.current = setInterval(() => {
        setExecModal((prev) => ({ ...prev, timer: prev.timer + 1 }))
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [execModal.isOpen, execModal.running])

  // Handle DONE button
  const handleDone = () => {
    if (!execModal.workout) return
    const nextIdx = execModal.exerciseIdx + 1
    if (nextIdx < execModal.workout.exercises.length) {
      setExecModal({
        ...execModal,
        exerciseIdx: nextIdx,
        timer: 0,
        running: true,
      })
      setTodayProgressIdx(nextIdx)
    } else {
      setTodayProgressIdx(execModal.workout.exercises.length)
      setExecModal({
        isOpen: false,
        workout: null,
        exerciseIdx: 0,
        timer: 0,
        running: false,
      })
    }
  }

  // When modal closes without finishing, persist progress
  React.useEffect(() => {
    if (!execModal.isOpen && execModal.workout && nextWorkout && execModal.workout.id === nextWorkout.id) {
      setTodayProgressIdx(execModal.exerciseIdx)
    }
    // eslint-disable-next-line
  }, [execModal.isOpen])

  // Helper: get video URL for an exercise (mock for now)
  function getVideoUrl(exerciseName: string) {
    // In the future, fetch from DB by exerciseName
    if (exerciseName.toLowerCase() === 'squats') {
      return 'https://www.youtube.com/embed/aclHkVaku9U'
    }
    if (exerciseName.toLowerCase() === 'pushups') {
      return 'https://www.youtube.com/embed/_l3ySVKYVJ8'
    }
    // Default video
    return 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }

  if (profileLoading || workoutsLoading) return <Text>Loading dashboard...</Text>

  return (
    <Box py={8} display="flex" flexDirection="column" alignItems="center" minH="100vh" w="100vw">
      <Heading mb={6} textAlign="center">Welcome back, {profile?.name || user?.email}</Heading>

      <SimpleGrid columns={{ base: 1, md: 5 }} spacing={6} mb={8} w="100%">
        {/* Profile Card */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={2} textAlign="center">Profile</Heading>
            <Text><b>Gender:</b> {profile?.gender || 'Not set'}</Text>
            <Text><b>Age:</b> {profile?.dob ? calculateAge(profile.dob) : 'Not set'}</Text>
            <Text><b>DOB:</b> {profile?.dob || 'Not set'}</Text>
            <Text><b>City:</b> {profile?.city || 'Not set'}</Text>
            <Text><b>Email:</b> {profile?.email || 'Not set'}</Text>
            <Text><b>Phone Number:</b> {profile?.phone || 'Not set'}</Text>
          </CardBody>
        </Card>
        {/* Today Card */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={2} textAlign="center">Today</Heading>
            {nextWorkout ? (
              <>
                <Text><b>{nextWorkout.name}</b></Text>
                <Text>{nextWorkout.type} • {nextWorkout.duration}</Text>
                <Text>{nextWorkout.date}</Text>
                <Text>{nextWorkout.time ? nextWorkout.time : 'Time: Not set'}</Text>
                <Text>{nextWorkout.notes}</Text>
                {/* Progress Bar */}
                {nextWorkout.exercises && nextWorkout.exercises.length > 0 && (
                  <Box mt={3} mb={2}>
                    <Progress
                      value={execModal.isOpen && execModal.workout?.id === nextWorkout.id
                        ? ((execModal.exerciseIdx) / nextWorkout.exercises.length) * 100
                        : (todayProgressIdx / nextWorkout.exercises.length) * 100}
                      size="sm"
                      colorScheme="blue"
                      borderRadius="md"
                    />
                    <Text fontSize="xs" textAlign="center" mt={1}>
                      {execModal.isOpen && execModal.workout?.id === nextWorkout.id
                        ? `Exercise ${Math.min(execModal.exerciseIdx + 1, nextWorkout.exercises.length)} of ${nextWorkout.exercises.length}`
                        : todayProgressIdx > 0
                          ? `Exercise ${Math.min(todayProgressIdx + 1, nextWorkout.exercises.length)} of ${nextWorkout.exercises.length}`
                          : `Exercise 1 of ${nextWorkout.exercises.length}`}
                    </Text>
                  </Box>
                )}
                <Box mt={4} display="flex" justifyContent="center">
                  <button
                    style={{
                      background: '#3182ce', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem'
                    }}
                    onClick={() => setExecModal({
                      isOpen: true,
                      workout: nextWorkout,
                      exerciseIdx: todayProgressIdx >= nextWorkout.exercises.length ? 0 : todayProgressIdx,
                      timer: 0,
                      running: true,
                    })}
                  >
                    {todayProgressIdx > 0 && todayProgressIdx < nextWorkout.exercises.length ? 'Continue Workout' : 'Start Workout'}
                  </button>
                </Box>
              </>
            ) : (
              <Text>No workout scheduled for today.</Text>
            )}
          </CardBody>
        </Card>
        {/* Team Card */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={2} textAlign="center">Team</Heading>
            <Text><b>Team:</b> {profile?.team || 'Not set'}</Text>
            <Text><b>Indoor Events:</b> {profile?.indoorEvents?.join(', ') || 'Not set'}</Text>
            <Text><b>Outdoor Events:</b> {profile?.outdoorEvents?.join(', ') || 'Not set'}</Text>
            <Text><b>School:</b> {profile?.school || 'Not set'}</Text>
            <Text><b>Coach:</b> {profile?.coach || coachName}</Text>
            <Text><b>Coach Phone Number:</b> {profile?.coachPhone || 'Not set'}</Text>
          </CardBody>
        </Card>
        {/* Weather Card */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={2} textAlign="center">Weather</Heading>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Text fontSize="lg">New York, NY</Text>
              <Text fontSize="4xl" fontWeight="bold">72°F</Text>
              <Box as="img" src="/images/weather-sunny.png" alt="Sunny" w={12} h={12} />
              <Text>Sunny</Text>
            </Box>
          </CardBody>
        </Card>
        {/* Upcoming Events Card */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={2} textAlign="center">Upcoming Events</Heading>
            <Box>
              <Image 
                src="/images/track-event.jpg" 
                alt="Track Championship" 
                borderRadius="md" 
                mb={2}
              />
              <Text><b>Event:</b> Annual Track Championship</Text>
              <Text><b>Date:</b> 2023-12-10</Text>
              <Text><b>Time:</b> 9:00 AM</Text>
              <Text><b>Address:</b> Central Stadium, New York</Text>
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Graph and Milestones */}
      <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={6} w="100%">
        <Card>
          <CardBody>
            <Heading size="md" mb={4} textAlign="center">Weekly Workout Stats</Heading>
            {/* Placeholder Bar Chart */}
            <Box h="250px">
              <Bar data={statsData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </Box>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Heading size="md" mb={4} textAlign="center">Team Milestones</Heading>
            <Box as="ul" pl={4}>
              {milestones.map((m, i) => (
                <li key={i}><Text>{m}</Text></li>
              ))}
            </Box>
          </CardBody>
        </Card>
      </Grid>

      {/* --- Exercise Execution Modal --- */}
      <Modal isOpen={execModal.isOpen} onClose={() => setExecModal({ ...execModal, isOpen: false, running: false })} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Exercise Execution</ModalHeader>
          <ModalCloseButton onClick={() => setExecModal({ ...execModal, isOpen: false, running: false })} />
          <ModalBody pb={6}>
            {execModal.workout && (
              <VStack spacing={4} align="center">
                <Heading size="md">
                  {execModal.workout.exercises[execModal.exerciseIdx]?.name}
                </Heading>
                <Text>
                  Sets: {execModal.workout.exercises[execModal.exerciseIdx]?.sets} &nbsp;|
                  Reps: {execModal.workout.exercises[execModal.exerciseIdx]?.reps}
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {Math.floor(execModal.timer / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {(execModal.timer % 60).toString().padStart(2, '0')}
                </Text>
                <HStack>
                  {execModal.running ? (
                    <button style={{background:'#ecc94b',color:'#222',border:'none',borderRadius:6,padding:'8px 20px',fontWeight:600,cursor:'pointer',fontSize:'1rem'}} onClick={() => setExecModal({ ...execModal, running: false })}>Stop</button>
                  ) : (
                    <button style={{background:'#3182ce',color:'white',border:'none',borderRadius:6,padding:'8px 20px',fontWeight:600,cursor:'pointer',fontSize:'1rem'}} onClick={() => setExecModal({ ...execModal, running: true })}>Start</button>
                  )}
                  <button style={{background:'#38a169',color:'white',border:'none',borderRadius:6,padding:'8px 20px',fontWeight:600,cursor:'pointer',fontSize:'1rem'}} onClick={handleDone}>
                    {execModal.exerciseIdx + 1 < execModal.workout.exercises.length ? 'DONE (Next)' : 'DONE (Finish)'}
                  </button>
                  <button style={{background:'#4299e1',color:'white',border:'none',borderRadius:6,padding:'8px 20px',fontWeight:600,cursor:'pointer',fontSize:'1rem'}}
                    onClick={() => setVideoModal({
                      isOpen: true,
                      videoUrl: getVideoUrl(execModal.workout.exercises[execModal.exerciseIdx]?.name),
                      exerciseName: execModal.workout.exercises[execModal.exerciseIdx]?.name || '',
                    })}
                  >
                    How to
                  </button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* --- End Exercise Execution Modal --- */}
      {/* --- Exercise Video Modal --- */}
      <Modal isOpen={videoModal.isOpen} onClose={() => setVideoModal({ ...videoModal, isOpen: false })} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>How to: {videoModal.exerciseName}</ModalHeader>
          <ModalCloseButton onClick={() => setVideoModal({ ...videoModal, isOpen: false })} />
          <ModalBody pb={6} display="flex" flexDirection="column" alignItems="center">
            <Box w="100%" h="0" pb="56.25%" position="relative">
              <iframe
                src={videoModal.videoUrl}
                title={videoModal.exerciseName}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* --- End Exercise Video Modal --- */}
    </Box>
  )
} 