import { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  HStack,
  Box,
  Textarea,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Flex
} from '@chakra-ui/react';
import { StarIcon, ChevronDownIcon } from '@chakra-ui/icons';

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  userAvatar?: string;
  onSubmitFeedback: (rating: number, message: string, username: string) => Promise<void>;
};

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  username = 'Anonymous User', 
  userAvatar = '', 
  onSubmitFeedback 
}: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState(username);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Using any to bypass the type checking - this is safe in this case
  // as we know TextArea is a valid focusable element in Chakra UI
  const initialRef = useRef<any>(null);
  const toast = useToast();

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating before submitting',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitFeedback(rating, message, displayName);
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Reset form
      setRating(0);
      setMessage('');
      onClose();
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Unable to submit your feedback. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="md" maxW="450px">
        <ModalHeader textAlign="center" fontSize="2xl" fontWeight="bold">Your Feedback</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text textAlign="center" color="gray.500" mb={6}>
            Help us improve by sharing your experience with the app.
          </Text>
          
          <Box textAlign="center" mb={6}>
            <HStack spacing={2} justify="center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Box
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  cursor="pointer"
                  p={2}
                  borderRadius="md"
                  bg="gray.100"
                  _hover={{ bg: 'gray.200' }}
                >
                  <StarIcon
                    w={6}
                    h={6}
                    color={(hoveredRating || rating) >= star ? 'orange.400' : 'gray.300'}
                  />
                </Box>
              ))}
            </HStack>
          </Box>
          
          <Textarea
            ref={initialRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your Message..."
            resize="vertical"
            h="120px"
            mb={4}
            bg="gray.100"
            border="none"
            _focus={{ border: '1px solid', borderColor: 'blue.400' }}
          />
          
          <Flex justify="space-between" align="center">
            <Menu>
              <MenuButton 
                as={Button} 
                variant="ghost" 
                rightIcon={<ChevronDownIcon />}
                pl={0}
              >
                <Flex align="center">
                  <Avatar size="sm" name={displayName} src={userAvatar} mr={2} />
                  <Text>{displayName}</Text>
                </Flex>
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => setDisplayName(username)}>
                  {username}
                </MenuItem>
                <MenuItem onClick={() => setDisplayName('Anonymous')}>
                  Submit Anonymously
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </ModalBody>

        <Box pt={6} mb={2} width="100%" px={4}>
          <Button 
            colorScheme="blue" 
            width="100%" 
            borderRadius="md" 
            height="40px"
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default FeedbackModal; 