import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Avatar,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'

// Add event list for selection
const EVENT_OPTIONS = [
  // Sprints
  '100 meters', '200 meters', '400 meters',
  // Middle-Distance
  '800 meters', '1500 meters', 'Mile Run (1609 meters)',
  // Long-Distance
  '3000 meters', '5000 meters', '10,000 meters',
  'Marathon (42.195 km)',
  // Hurdles
  '100m hurdles (women)', '110m hurdles (men)', '400m hurdles',
  // Relays
  '4x100m relay', '4x400m relay', '4x800m relay', 'Sprint Medley Relay',
  // Steeplechase
  '3000m steeplechase',
]

// Add coach options
const COACH_OPTIONS = [
  'Coach Carter',
  'Coach Smith',
  'Coach Lee',
  'Coach Johnson',
]

export function calculateAge(dob: string) {
  if (!dob) return ''
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

interface ProfileData {
  name: string
  role: string
  team: string
  email: string
  phone: string
  bio: string
  gender: string
  dob: string
  events: string[]
  coach?: string
}

export function Profile() {
  const { user } = useAuth()
  const toast = useToast()
  const { profile: remoteProfile, isLoading, isError, updateProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    name: 'John Doe',
    role: 'Athlete',
    team: 'Track Stars',
    email: user?.email || '',
    phone: '+1 234 567 8900',
    bio: 'Track & Field athlete specializing in sprint events.',
    gender: '',
    dob: '',
    events: [],
    coach: '',
  })

  // Load profile from Supabase on mount or when remoteProfile changes
  useEffect(() => {
    if (remoteProfile) {
      setProfile({
        ...profile,
        ...remoteProfile,
        events: remoteProfile.events || [],
      })
    }
    // eslint-disable-next-line
  }, [remoteProfile])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile.events || profile.events.length === 0) {
      toast({
        title: 'Please select at least one event',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    updateProfile(profile)
    setIsEditing(false)
    toast({
      title: 'Profile updated',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  if (isLoading) return <Text>Loading profile...</Text>
  if (isError) return <Text>Error loading profile.</Text>

  return (
    <Box py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading>Profile</Heading>
          <Button
            colorScheme="brand"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </HStack>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <HStack spacing={6}>
                <Avatar size="xl" name={profile.name} src="/images/profile-avatar.jpg" />
                <VStack align="start" spacing={1}>
                  <Heading size="md">{profile.name}</Heading>
                  <Text color="gray.600">{profile.role}</Text>
                  <Text fontSize="sm">{profile.team}</Text>
                </VStack>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  isDisabled={!isEditing}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={profile.role}
                  onChange={(e) =>
                    setProfile({ ...profile, role: e.target.value })
                  }
                  isDisabled={!isEditing}
                >
                  <option value="Athlete">Athlete</option>
                  <option value="Coach">Coach</option>
                  <option value="Team Manager">Team Manager</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Team</FormLabel>
                <Input
                  value={profile.team}
                  onChange={(e) =>
                    setProfile({ ...profile, team: e.target.value })
                  }
                  isDisabled={!isEditing}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  isDisabled={!isEditing}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  isDisabled={!isEditing}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Input
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  isDisabled={!isEditing}
                />
              </FormControl>

              {/* Gender */}
              <FormControl isRequired>
                <FormLabel>Gender</FormLabel>
                <Select
                  value={profile.gender}
                  onChange={e => setProfile({ ...profile, gender: e.target.value })}
                  isDisabled={!isEditing}
                  placeholder="Select gender"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
              </FormControl>

              {/* Date of Birth */}
              <FormControl isRequired>
                <FormLabel>Date of Birth</FormLabel>
                <Input
                  type="date"
                  value={profile.dob}
                  onChange={e => setProfile({ ...profile, dob: e.target.value })}
                  isDisabled={!isEditing}
                />
                {profile.dob && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Age: {calculateAge(profile.dob)}
                  </Text>
                )}
              </FormControl>

              {/* Events */}
              <FormControl>
                <FormLabel>Events</FormLabel>
                {isEditing ? (
                  <CheckboxGroup
                    colorScheme="brand"
                    value={profile.events}
                    onChange={vals => setProfile({ ...profile, events: vals as string[] })}
                  >
                    <Stack spacing={2} direction="column">
                      {EVENT_OPTIONS.map(ev => (
                        <Checkbox key={ev} value={ev}>{ev}</Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                ) : (
                  <Text>{profile.events.length > 0 ? profile.events.join(', ') : 'No events selected'}</Text>
                )}
              </FormControl>

              {/* Coach Selection */}
              <FormControl>
                <FormLabel>Coach</FormLabel>
                {isEditing ? (
                  <Select
                    value={profile.coach || ''}
                    onChange={e => setProfile({ ...profile, coach: e.target.value })}
                    placeholder="Select coach"
                  >
                    {COACH_OPTIONS.map(coach => (
                      <option key={coach} value={coach}>{coach}</option>
                    ))}
                  </Select>
                ) : (
                  <Text>{profile.coach || 'No coach selected'}</Text>
                )}
              </FormControl>

              {isEditing && (
                <Button type="submit" colorScheme="brand">
                  Save Changes
                </Button>
              )}
            </VStack>
          </form>
        </Box>
      </VStack>
    </Box>
  )
} 