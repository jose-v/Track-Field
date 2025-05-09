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
} from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface ProfileData {
  name: string
  role: string
  team: string
  email: string
  phone: string
  bio: string
}

export function Profile() {
  const { user } = useAuth()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    name: 'John Doe',
    role: 'Athlete',
    team: 'Track Stars',
    email: user?.email || '',
    phone: '+1 234 567 8900',
    bio: 'Track & Field athlete specializing in sprint events.',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the profile data to your backend
    setIsEditing(false)
    toast({
      title: 'Profile updated',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

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
                <Avatar size="xl" name={profile.name} />
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