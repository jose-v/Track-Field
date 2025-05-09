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
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'

export function Dashboard() {
  const { user } = useAuth()

  return (
    <Box py={8}>
      <Heading mb={6}>Welcome back, {user?.email}</Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Workouts This Week</StatLabel>
              <StatNumber>4</StatNumber>
              <StatHelpText>↑ 23% from last week</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Sleep Average</StatLabel>
              <StatNumber>7.5h</StatNumber>
              <StatHelpText>↓ 0.5h from last week</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Team Activity</StatLabel>
              <StatNumber>12</StatNumber>
              <StatHelpText>New posts this week</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={6}>
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              Recent Workouts
            </Heading>
            <Text>No recent workouts to display</Text>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              Team Updates
            </Heading>
            <Text>No team updates to display</Text>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  )
} 