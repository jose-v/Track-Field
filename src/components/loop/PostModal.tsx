import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Flex,
  Text,
  Avatar,
  Input,
  Button,
  useToast,
  VStack,
  Spinner,
  Divider,
  Image as ChakraImage,
  useColorModeValue,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { FaHeart, FaRegHeart, FaShare, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

interface PostUser {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: PostUser;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  created_at: string;
  updated_at: string;
  likes: number;
  comments_count: number;
  user: PostUser;
  post_type: 'text' | 'image' | 'video';
}

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  currentUser: any;
}

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, post, currentUser }) => {
  if (!post) return null;

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const commentsBorderColor = useColorModeValue('blue.100', 'blue.600');
  const emptyStateColor = useColorModeValue('gray.500', 'gray.400');

  const formattedDate = format(new Date(post.created_at), 'MMM d, yyyy • h:mm a');

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      fetchLikeState();
    }
    // eslint-disable-next-line
  }, [isOpen, post.id]);

  const fetchLikeState = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('loop_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUser.id)
      .single();
    setLiked(!!data);
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('loop_comments')
        .select('id, post_id, user_id, content, created_at')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      if (commentsError) throw commentsError;
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setIsLoading(false);
        return;
      }
      const userIds = commentsData.map(c => c.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);
      if (usersError) throw usersError;
      const commentsWithUsers = commentsData.map(comment => {
        const user = usersData?.find(u => u.id === comment.user_id) || {
          first_name: 'Unknown', last_name: 'User', avatar_url: null
        };
        return {
          ...comment,
          user: {
            first_name: user.first_name,
            last_name: user.last_name,
            avatar_url: user.avatar_url
          }
        };
      });
      setComments(commentsWithUsers);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    if (!liked) {
      // Like the post
      setLiked(true);
      setLikesCount((c) => c + 1);
      const { error } = await supabase
        .from('loop_likes')
        .insert({ post_id: post.id, user_id: currentUser.id });
      if (!error) {
        await supabase
          .from('loop_posts')
          .update({ likes: likesCount + 1 })
          .eq('id', post.id);
      } else {
        setLiked(false);
        setLikesCount((c) => c - 1);
      }
    } else {
      // Unlike the post
      setLiked(false);
      setLikesCount((c) => Math.max(0, c - 1));
      const { error } = await supabase
        .from('loop_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id);
      if (!error) {
        await supabase
          .from('loop_posts')
          .update({ likes: Math.max(0, likesCount - 1) })
          .eq('id', post.id);
      } else {
        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    }
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const { data: newComment, error: commentError } = await supabase
        .from('loop_comments')
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
          content: commentText,
        })
        .select();
      if (commentError) throw commentError;
      setCommentText('');
      // Get user profile for the comment
      const { data: userData } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', currentUser.id)
        .single();
      if (newComment && newComment.length > 0) {
        setComments(prev => [
          ...prev,
          {
            ...newComment[0],
            user: {
              first_name: userData?.first_name || currentUser.user_metadata?.first_name || 'User',
              last_name: userData?.last_name || currentUser.user_metadata?.last_name || '',
              avatar_url: userData?.avatar_url || currentUser.user_metadata?.avatar_url
            }
          }
        ]);
      }
      toast({
        title: 'Comment added',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error adding comment',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderColor={borderColor} maxH="90vh">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          <Flex align="center">
            <Avatar 
              src={post.user.avatar_url || 'https://via.placeholder.com/40'} 
              name={`${post.user.first_name} ${post.user.last_name}`}
              size="md" 
              mr={3} 
            />
            <Box>
              <Text fontWeight="bold" color={textColor}>
                {post.user.first_name} {post.user.last_name}
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {formattedDate}
              </Text>
            </Box>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody p={0} overflowY="auto">
          {/* Post Content */}
          <Box p={6} borderBottomWidth="1px" borderColor={borderColor}>
            <Text mb={4} color={textColor} fontSize="md">
              {post.content}
            </Text>
            
            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <Box mb={4}>
                {post.post_type === 'image' ? (
                  <ChakraImage 
                    src={post.media_urls[0]} 
                    alt="Post media"
                    borderRadius="md"
                    maxH="400px"
                    w="100%"
                    objectFit="cover"
                  />
                ) : post.post_type === 'video' ? (
                  <video 
                    src={post.media_urls[0]} 
                    controls
                    style={{ 
                      width: '100%', 
                      maxHeight: '400px', 
                      borderRadius: '6px' 
                    }}
                  />
                ) : null}
              </Box>
            )}

            {/* Action Buttons */}
            <Flex justify="space-between" align="center">
              <Flex align="center">
                <Button 
                  leftIcon={<Icon as={liked ? FaHeart : FaRegHeart} />} 
                  variant="ghost" 
                  size="sm"
                  colorScheme={liked ? 'red' : 'gray'}
                  onClick={handleLike}
                  mr={4}
                >
                  {likesCount}
                </Button>
                
                <Text fontSize="sm" color={subtitleColor}>
                  {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </Text>
              </Flex>
              
              <Flex align="center">
                <IconButton
                  icon={<Icon as={FaShare} />}
                  variant="ghost"
                  size="sm"
                  aria-label="Share post"
                  mr={2}
                />
                
                <IconButton
                  icon={<Icon as={saved ? FaBookmark : FaRegBookmark} />}
                  variant="ghost"
                  size="sm"
                  aria-label="Save post"
                  onClick={handleSave}
                />
              </Flex>
            </Flex>
          </Box>

          {/* Comments Section */}
          <Box p={6}>
            <VStack spacing={4} align="stretch">
              {isLoading ? (
                <Flex justify="center" py={4}>
                  <Spinner size="md" />
                </Flex>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <Box key={comment.id} pl={4} borderLeft="2px" borderColor={commentsBorderColor}>
                    <Flex align="center" mb={2}>
                      <Avatar 
                        src={comment.user.avatar_url || 'https://via.placeholder.com/30'} 
                        name={`${comment.user.first_name} ${comment.user.last_name}`}
                        size="sm" 
                        mr={2} 
                      />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>
                          {comment.user.first_name} {comment.user.last_name}
                        </Text>
                        <Text fontSize="xs" color={subtitleColor}>
                          {format(new Date(comment.created_at), 'MMM d, yyyy • h:mm a')}
                        </Text>
                      </Box>
                    </Flex>
                    <Text pl={10} color={textColor}>{comment.content}</Text>
                  </Box>
                ))
              ) : (
                <Text fontSize="sm" textAlign="center" color={emptyStateColor} py={4}>
                  No comments yet. Be the first to comment!
                </Text>
              )}
            </VStack>
            
            {/* Add Comment Input */}
            <Flex mt={6} pt={4} borderTopWidth="1px" borderColor={borderColor}>
              <Avatar 
                src={currentUser?.user_metadata?.avatar_url || 'https://via.placeholder.com/30'} 
                name={currentUser?.user_metadata?.full_name || ''}
                size="sm" 
                mr={3} 
              />
              <Input 
                placeholder="Add a comment..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleComment();
                  }
                }}
                mr={3}
                bg={useColorModeValue('gray.50', 'gray.700')}
                borderColor={borderColor}
              />
              <Button 
                colorScheme="blue" 
                onClick={handleComment}
                isDisabled={!commentText.trim()}
                size="sm"
              >
                Post
              </Button>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PostModal; 