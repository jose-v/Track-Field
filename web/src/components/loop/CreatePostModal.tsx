import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  FormControl,
  FormLabel,
  Box,
  Flex,
  Icon,
  Text,
  Image,
  IconButton,
  Spinner,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  Divider,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaImage, FaVideo, FaPoll, FaTimes, FaUpload } from 'react-icons/fa';
import { MdEmojiEmotions } from 'react-icons/md';
import { supabase } from '../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import '../../styles/Loop.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (post: any) => void;
  currentUser: any;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onCreatePost,
  currentUser,
}) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const selectedFiles = Array.from(files);
    
    // Check file type
    const fileType = selectedFiles[0].type.split('/')[0];
    if (fileType === 'image') {
      setPostType('image');
    } else if (fileType === 'video') {
      setPostType('video');
    }
    
    // Create preview URLs
    const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
    
    setMediaFiles(selectedFiles);
    setPreviewUrls(newPreviewUrls);
  };
  
  const removeMedia = (index: number) => {
    const newMediaFiles = [...mediaFiles];
    const newPreviewUrls = [...previewUrls];
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(newPreviewUrls[index]);
    
    newMediaFiles.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setMediaFiles(newMediaFiles);
    setPreviewUrls(newPreviewUrls);
    
    if (newMediaFiles.length === 0) {
      setPostType('text');
    }
  };
  
  const uploadMedia = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${currentUser.id}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('loop_media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('loop_media')
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  };
  
  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: 'Post content required',
        description: 'Please add some text or media to your post.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let mediaUrls: string[] = [];
      
      // Upload any media files
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(file => uploadMedia(file));
        mediaUrls = await Promise.all(uploadPromises);
      }
      
      // Create the post
      const newPost = {
        user_id: currentUser.id,
        content: content.trim(),
        media_urls: mediaUrls,
        post_type: postType,
        likes: 0,
        comments_count: 0
      };
      
      onCreatePost(newPost);
      
      // Reset form
      setContent('');
      setMediaFiles([]);
      setPreviewUrls([]);
      setPostType('text');
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error creating post',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openFileSelector = (type: 'image' | 'video') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' 
        ? 'image/jpeg, image/png, image/gif' 
        : 'video/mp4, video/quicktime';
      fileInputRef.current.click();
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Create Post</ModalHeader>
        <ModalCloseButton />
        <Divider borderColor={borderColor} />
        
        <ModalBody py={4}>
          <Flex align="flex-start" mb={4}>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={handleContentChange}
              rows={5}
              resize="vertical"
              flexGrow={1}
              focusBorderColor="blue.400"
            />
          </Flex>
          
          {previewUrls.length > 0 && (
            <Box 
              className="post-media-container"
              position="relative"
              mb={4}
            >
              {postType === 'image' ? (
                <Image 
                  src={previewUrls[0]} 
                  alt="Media preview" 
                  className="loop-post-image"
                />
              ) : (
                <video 
                  src={previewUrls[0]} 
                  controls 
                  className="loop-post-video"
                />
              )}
              
              <IconButton
                icon={<Icon as={FaTimes} />}
                aria-label="Remove media"
                size="sm"
                colorScheme="red"
                position="absolute"
                top={2}
                right={2}
                onClick={() => removeMedia(0)}
              />
            </Box>
          )}
          
          <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
            <TabList>
              <Tab>Media</Tab>
              <Tab isDisabled>Poll</Tab>
              <Tab isDisabled>Emoji</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Button
                    leftIcon={<Icon as={FaImage} />}
                    onClick={() => openFileSelector('image')}
                    variant="outline"
                    size="sm"
                    isDisabled={mediaFiles.length > 0}
                  >
                    Add Photo
                  </Button>
                  
                  <Button
                    leftIcon={<Icon as={FaVideo} />}
                    onClick={() => openFileSelector('video')}
                    variant="outline"
                    size="sm"
                    isDisabled={mediaFiles.length > 0}
                  >
                    Add Video
                  </Button>
                </Grid>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </TabPanel>
              
              <TabPanel>
                <Flex justify="center" align="center" p={4}>
                  <Text color="gray.500">
                    Polls coming soon!
                  </Text>
                </Flex>
              </TabPanel>
              
              <TabPanel>
                <Flex justify="center" align="center" p={4}>
                  <Text color="gray.500">
                    Emoji picker coming soon!
                  </Text>
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        
        <Divider borderColor={borderColor} />
        <Box pt={4} mb={2} width="100%" px={4} display="flex" justifyContent="flex-end">
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Posting"
            isDisabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}
          >
            Post
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default CreatePostModal; 