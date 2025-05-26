import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '@chakra-ui/react'

export function useTeam() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const posts = useQuery({
    queryKey: ['team-posts'],
    queryFn: () => api.team.getPosts(),
  })

  const createPost = useMutation({
    mutationFn: api.team.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-posts'] })
      toast({
        title: 'Success',
        description: 'Post created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const deletePost = useMutation({
    mutationFn: api.team.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-posts'] })
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  return {
    posts: posts.data || [],
    isLoading: posts.isLoading,
    isError: posts.isError,
    error: posts.error,
    createPost: createPost.mutate,
    deletePost: deletePost.mutate,
  }
} 