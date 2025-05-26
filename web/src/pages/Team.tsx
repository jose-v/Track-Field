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
  Card,
  CardBody,
  Flex,
  Icon,
  Container,
  Divider,
} from '@chakra-ui/react'
import { useState } from 'react'
import { FaUsers, FaComments, FaUserFriends, FaComment } from 'react-icons/fa'

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
      avatar: '/images/coach-avatar.jpg',
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Athlete',
      avatar: '/images/athlete-avatar.jpg',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      role: 'Athlete',
      avatar: '/images/athlete-avatar2.jpg',
    },
    {
      id: '4',
      name: 'Sarah Williams',
      role: 'Athlete',
      avatar: '/images/athlete-avatar3.jpg',
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
    <Container maxW="container.xl" py={8}>
      <HStack justify="space-between" mb={6}>
        <Heading>Team</Heading>
        <Button colorScheme="brand" leftIcon={<FaComment />} onClick={onOpen}>
          New Post
        </Button>
      </HStack>

      <VStack spacing={6} align="stretch">
        {/* Team Members Card */}
        <Card 
          borderRadius="lg" 
          overflow="hidden" 
          boxShadow="md"
        >
          {/* Hero Background */}
          <Box 
            h="80px" 
            bg="linear-gradient(135deg, #805AD5 0%, #B794F4 100%)" 
            position="relative"
          >
            <Flex 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              bg="white" 
              borderRadius="full" 
              w="50px" 
              h="50px" 
              justifyContent="center" 
              alignItems="center"
              boxShadow="md"
            >
              <Icon as={FaUserFriends} w={6} h={6} color="purple.500" />
            </Flex>
          </Box>
          
          <CardBody pt={6}>
            <Heading size="md" mb={4} textAlign="center">
              Team Members
            </Heading>
            
            <VStack spacing={4}>
              <HStack spacing={4} justify="center" w="100%">
                <AvatarGroup size="md" max={4}>
                  {teamMembers.map((member) => (
                    <Avatar key={member.id} name={member.name} src={member.avatar} />
                  ))}
                </AvatarGroup>
              </HStack>
              
              <VStack align="center" spacing={1} textAlign="center">
                <Text fontWeight="bold">{teamMembers.length} Members</Text>
                <Text fontSize="sm" color="gray.600">
                  {teamMembers.map((m) => m.name).join(', ')}
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Team Feed Card */}
        <Card 
          borderRadius="lg" 
          overflow="hidden" 
          boxShadow="md"
        >
          {/* Hero Background */}
          <Box 
            h="80px" 
            bg="linear-gradient(135deg, #4299E1 0%, #90CDF4 100%)" 
            position="relative"
          >
            <Flex 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              bg="white" 
              borderRadius="full" 
              w="50px" 
              h="50px" 
              justifyContent="center" 
              alignItems="center"
              boxShadow="md"
            >
              <Icon as={FaComments} w={6} h={6} color="blue.500" />
            </Flex>
          </Box>
          
          <CardBody pt={6}>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" textAlign="center" w="100%">
                Team Feed
              </Heading>
            </HStack>
            
            {posts.length === 0 ? (
              <VStack spacing={4} py={4}>
                <Icon as={FaComments} w={10} h={10} color="gray.300" />
                <Text textAlign="center" color="gray.500">No posts yet. Be the first to share something!</Text>
                <Button 
                  size="sm" 
                  colorScheme="blue" 
                  leftIcon={<FaComment />} 
                  onClick={onOpen}
                >
                  Create Post
                </Button>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                {posts.map((post) => (
                  <Box
                    key={post.id}
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    bg="gray.50"
                  >
                    <HStack spacing={3} mb={2}>
                      <Avatar
                        size="sm"
                        name={post.author.name}
                        src={post.author.avatar}
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{post.author.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(post.timestamp).toLocaleDateString()} at {new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                      </VStack>
                    </HStack>
                    <Divider my={2} />
                    <Text mt={2}>{post.content}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
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
    </Container>
  )
} 