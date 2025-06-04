// TrainingPlansPage.tsx

import React, { useState } from 'react'
import {
  Box,
  Flex,
  Heading,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  useColorModeValue,
  Badge,
  useToast,
} from '@chakra-ui/react'
import {
  FaPlus,
  FaFileImport,
  FaCalendarAlt,
  FaDumbbell,
  FaLayerGroup,
  FaUsers,
  FaTrash,
  FaRedo,
} from 'react-icons/fa'

// Real hooks from the actual architecture
import { useAuth } from '../src/contexts/AuthContext'
import { useWorkouts } from '../src/hooks/useWorkouts'
import { useCoachAthletes } from '../src/hooks/useCoachAthletes'

export function TrainingPlansPage() {
  const toast = useToast()
  const { user } = useAuth()
  
  // Real hooks for data
  const { data: athletes, isLoading: athletesLoading } = useCoachAthletes()
  const { workouts, isLoading: workoutsLoading } = useWorkouts()
  
  // Local state
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAthlete, setSelectedAthlete] = useState('all')
  const [workoutFilter, setWorkoutFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // Sample data for testing - replace with real data loading
  const plans = [] // TODO: Load from api.monthlyPlans.getByCoach(user.id)
  const templates = [] // TODO: Load from api.workouts.getTemplates(user.id)
  const drafts = [] // TODO: Load from api.workouts.getDrafts(user.id) 
  const deleted = [] // TODO: Load from api.workouts.getDeleted(user.id) + api.monthlyPlans.getDeleted(user.id)
  
  const allAthletes = [{ id: 'all', first_name: 'All', last_name: 'Athletes' }].concat(
    athletes || []
  )

  function handleTabChange(idx: number) {
    setActiveTabIndex(idx)
    // Clear or reapply filters if needed
  }
  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200) // simulate loading
    toast({ title: 'Refreshed', status: 'success' })
  }
  function handleClearFilters() {
    setSearchQuery('')
    setSelectedAthlete('all')
    setWorkoutFilter('all')
  }

  // Helper function to get item display name
  const getItemName = (item: any) => {
    return item?.name || item?.title || 'Untitled Item'
  }

  // Helper function to get item description
  const getItemDescription = (item: any) => {
    return item?.description || item?.notes || 'No description'
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={{ base: 4, md: 8 }}
        py={4}
        bg={useColorModeValue('white', 'gray.800')}
        borderBottomWidth={1}
        boxShadow="sm"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Heading size="lg">Training Plans</Heading>
        <HStack spacing={4}>
          <Button leftIcon={<FaPlus />} colorScheme="purple">
            New Workout
          </Button>
          <Button leftIcon={<FaFileImport />} colorScheme="teal">
            Import
          </Button>
          <Button leftIcon={<FaCalendarAlt />} colorScheme="purple" variant="outline">
            New Plan
          </Button>
          <IconButton
            aria-label="Refresh"
            icon={<FaRedo />}
            variant="ghost"
            onClick={handleRefresh}
            isLoading={refreshing}
          />
        </HStack>
      </Flex>

      {/* Tabs */}
      <Tabs
        index={activeTabIndex}
        onChange={handleTabChange}
        colorScheme="purple"
        variant="enclosed"
        mt={2}
        isFitted
      >
        <TabList>
          <Tab><FaDumbbell />&nbsp;Workouts <Badge ml={2}>{workouts?.length || 0}</Badge></Tab>
          <Tab><FaCalendarAlt />&nbsp;Plans <Badge ml={2}>{plans.length}</Badge></Tab>
          <Tab><FaLayerGroup />&nbsp;Templates <Badge ml={2}>{templates.length}</Badge></Tab>
          <Tab><FaUsers />&nbsp;Drafts <Badge ml={2}>{drafts.length}</Badge></Tab>
          <Tab><FaTrash />&nbsp;Deleted <Badge ml={2}>{deleted.length}</Badge></Tab>
        </TabList>
        <TabPanels>
          {[workouts || [], plans, templates, drafts, deleted].map((items, idx) => (
            <TabPanel key={idx} px={0}>
              {/* Filters */}
              <Flex py={2} px={{ base: 4, md: 8 }} gap={4} align="center" wrap="wrap">
                <Input
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  w={{ base: '100%', md: '300px' }}
                />
                <Select
                  placeholder="All Athletes"
                  value={selectedAthlete}
                  onChange={e => setSelectedAthlete(e.target.value)}
                  w={{ base: '100%', md: '200px' }}
                >
                  {allAthletes.map(a => (
                    <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                  ))}
                </Select>
                <Select
                  value={workoutFilter}
                  onChange={e => setWorkoutFilter(e.target.value)}
                  w={{ base: '100%', md: '160px' }}
                >
                  <option value="all">All Types</option>
                  <option value="single">Single</option>
                  <option value="weekly">Weekly</option>
                </Select>
                <Button variant="ghost" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </Flex>
              {/* Content Grid */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} px={{ base: 4, md: 8 }} py={4}>
                {(refreshing)
                  ? Array(6).fill(null).map((_, idx) => (
                      <Skeleton key={idx} height="220px" borderRadius="lg" />
                    ))
                  : items.length === 0
                    ? <Box color="gray.500" textAlign="center" gridColumn="1/-1" py={16}>No items found.</Box>
                    : items.map((item, i) => (
                        <Box
                          key={item.id || i}
                          p={6}
                          bg="white"
                          borderRadius="xl"
                          boxShadow="md"
                          minH="200px"
                        >
                          <Heading as="h4" size="md" mb={2}>{getItemName(item)}</Heading>
                          <Box fontSize="sm" color="gray.500">{getItemDescription(item)}</Box>
                          {/* Action buttons, progress bar, etc go here */}
                        </Box>
                      ))
                }
              </SimpleGrid>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      {/* Floating Action Button */}
      <IconButton
        position="fixed"
        bottom={6}
        right={6}
        colorScheme="purple"
        aria-label="Quick Add"
        icon={<FaPlus />}
        borderRadius="full"
        boxSize={16}
        shadow="xl"
        zIndex={200}
      />
    </Box>
  )
}
