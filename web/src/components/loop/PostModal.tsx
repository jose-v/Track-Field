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
} from '@chakra-ui/react';
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
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
    // eslint-disable-next-line
  }, [isOpen, post.id]);

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
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>ZZZ TEST MODAL</ModalHeader>
        <ModalBody>ZZZ Minimal content for flicker test</ModalBody>
        <Box p={4}><Button onClick={onClose}>Close</Button></Box>
      </ModalContent>
    </Modal>
  );
};

export default PostModal; 