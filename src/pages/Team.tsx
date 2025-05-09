import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Avatar,
  AvatarGroup,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react'
import { useState } from 'react'

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
}

interface TeamPost {
  id: string
  author: TeamMember
  content: string
  timestamp: string
}

export function Team() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      role: 'Coach',
      avatar: 'https://bit.ly/dan-abramov',
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Athlete',
      avatar: 'https://bit.ly/ryan-florence',
    },
  ])

  const [posts, setPosts] = useState<TeamPost[]>([])
  const [newPost, setNewPost] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const post: TeamPost = {
      id: Date.now().toString(),
      author: teamMembers[0], // For demo, using the first team member
      content: newPost,
      timestamp: new Date().toISOString(),
    }
    setPosts([post, ...posts])
    onClose()
    setNewPost('')
  }

  return (
    <Box py={8}>
      <HStack justify="space-between" mb={6}>
        <Heading>Team</Heading>
        <Button colorScheme="brand" onClick={onOpen}>
          New Post
        </Button>
      </HStack>

      <VStack spacing={6} align="stretch">
        <Box p={4} borderWidth={1} borderRadius="md" bg="white">
          <Heading size="md" mb={4}>
            Team Members
          </Heading>
          <HStack spacing={4}>
            <AvatarGroup size="md" max={3}>
              {teamMembers.map((member) => (
                <Avatar key={member.id} name={member.name} src={member.avatar} />
              ))}
            </AvatarGroup>
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">{teamMembers.length} Members</Text>
              <Text fontSize="sm" color="gray.600">
                {teamMembers.map((m) => m.name).join(', ')}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            Team Feed
          </Heading>
          {posts.length === 0 ? (
            <Text>No posts yet. Be the first to share something!</Text>
          ) : (
            <VStack spacing={4} align="stretch">
              {posts.map((post) => (
                <Box
                  key={post.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  bg="white"
                >
                  <HStack spacing={3} mb={2}>
                    <Avatar
                      size="sm"
                      name={post.author.name}
                      src={post.author.avatar}
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{post.author.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </HStack>
                  <Text>{post.content}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Team Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>What's on your mind?</FormLabel>
                  <Textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share your thoughts with the team..."
                    rows={4}
                  />
                </FormControl>
                <Button type="submit" colorScheme="brand" width="full">
                  Post
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
} 