import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Icon,
  Button,
  Image,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useDisclosure,
  Input,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark, FaEllipsisV } from 'react-icons/fa';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import '../../styles/Loop.css';

interface PostUser {
  first_name: string;
  last_name: string;
  avatar_url: string;
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

interface FeedPostProps {
  post: Post;
  currentUser: any;
  onCommentAdded: () => void;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: PostUser;
}

const FeedPost: React.FC<FeedPostProps> = ({ post, currentUser, onCommentAdded }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const formattedDate = format(new Date(post.created_at), 'MMM d, yyyy • h:mm a');
  
  const handleLike = () => {
    setLiked(!liked);
    // Would need to update the backend here
  };
  
  const handleSave = () => {
    setSaved(!saved);
    // Would need to update the backend here
  };
  
  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      // Step 1: Insert the new comment
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
      
      // Step 2: Update comment count on the post
      await supabase
        .from('loop_posts')
        .update({ comments_count: post.comments_count + 1 })
        .eq('id', post.id);
      
      // Step 3: Get the user profile for the comment
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', currentUser.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        // Still refresh comments, even if we couldn't get user data
        fetchComments();
        onCommentAdded();
        return;
      }
      
      // Add the new comment with user data to the comments list
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
      
      // Notify parent component to refresh
      onCommentAdded();
      
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
  
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      // Step 1: Get comments for this post
      const { data: commentsData, error: commentsError } = await supabase
        .from('loop_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
        
      if (commentsError) throw commentsError;
      
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setIsLoadingComments(false);
        return;
      }
      
      // Step 2: Get user details for each comment
      const userIds = commentsData.map(comment => comment.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);
      
      if (usersError) throw usersError;
      
      // Step 3: Combine comments with user data
      const commentsWithUsers = commentsData.map(comment => {
        const user = usersData?.find(u => u.id === comment.user_id) || {
          first_name: 'Unknown',
          last_name: 'User',
          avatar_url: null
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
      setIsLoadingComments(false);
    }
  };
  
  const toggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };
  
  return (
    <Box className="feed-post-container">
      <Box p={4}>
        <Flex justify="space-between" align="flex-start" mb={4}>
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
              <Text fontSize="sm" color="gray.500">
                {formattedDate}
              </Text>
            </Box>
          </Flex>
          
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<Icon as={FaEllipsisV} />}
              variant="ghost"
              aria-label="Options"
              size="sm"
            />
            <MenuList>
              {currentUser && post.user_id === currentUser.id ? (
                <>
                  <MenuItem>Edit Post</MenuItem>
                  <MenuItem color="red.500">Delete Post</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem>Report Post</MenuItem>
                  <MenuItem>Hide Posts from this User</MenuItem>
                </>
              )}
            </MenuList>
          </Menu>
        </Flex>
        
        <Text mb={4} color={textColor}>
          {post.content}
        </Text>
      </Box>
      
      {post.media_urls && post.media_urls.length > 0 && (
        <Box className="post-media-container">
          {post.post_type === 'image' ? (
            <Image 
              src={post.media_urls[0]} 
              alt="Post media"
              className="loop-post-image"
            />
          ) : post.post_type === 'video' ? (
            <video 
              src={post.media_urls[0]} 
              controls
              className="loop-post-video"
            />
          ) : null}
        </Box>
      )}
      
      <Box p={4}>
        <Flex justify="space-between" mb={4}>
          <Flex align="center">
            <Button 
              leftIcon={<Icon as={liked ? FaHeart : FaRegHeart} />} 
              variant="ghost" 
              size="sm"
              colorScheme={liked ? 'red' : 'gray'}
              onClick={handleLike}
              mr={2}
            >
              {post.likes || 0}
            </Button>
            
            <Button 
              leftIcon={<Icon as={FaComment} />} 
              variant="ghost" 
              size="sm"
              onClick={toggleComments}
            >
              {post.comments_count || 0}
            </Button>
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
        
        {showComments && (
          <Box mt={4}>
            <Divider mb={4} />
            
            <VStack spacing={4} align="stretch">
              {isLoadingComments ? (
                <Flex justify="center" py={2}>
                  <Text>Loading comments...</Text>
                </Flex>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <Box key={comment.id} pl={4} borderLeft="2px" borderColor="blue.200">
                    <Flex align="center" mb={2}>
                      <Avatar 
                        src={comment.user.avatar_url || 'https://via.placeholder.com/30'} 
                        name={`${comment.user.first_name} ${comment.user.last_name}`}
                        size="sm" 
                        mr={2} 
                      />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">
                          {comment.user.first_name} {comment.user.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {format(new Date(comment.created_at), 'MMM d, yyyy • h:mm a')}
                        </Text>
                      </Box>
                    </Flex>
                    <Text pl={10}>{comment.content}</Text>
                  </Box>
                ))
              ) : (
                <Text fontSize="sm" textAlign="center" color="gray.500">
                  No comments yet. Be the first to comment!
                </Text>
              )}
            </VStack>
            
            <Flex mt={4}>
              <Avatar 
                src={currentUser?.user_metadata?.avatar_url || 'https://via.placeholder.com/30'} 
                name={currentUser?.user_metadata?.full_name || ''}
                size="sm" 
                mr={2} 
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
                mr={2}
              />
              <Button 
                colorScheme="blue" 
                onClick={handleComment}
                isDisabled={!commentText.trim()}
              >
                Post
              </Button>
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FeedPost; 