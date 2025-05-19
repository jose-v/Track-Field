import { IconButton, Box, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Text, Input, useToast, Flex, VStack, Divider, useColorModeValue } from '@chakra-ui/react';
import { LinkIcon } from '@chakra-ui/icons';
import { SiGmail, SiX, SiFacebook, SiWhatsapp, SiInstagram, SiTiktok } from 'react-icons/si';
import { LuShare } from 'react-icons/lu';
import { useState } from 'react';

interface ShareComponentProps {
  title?: string;
  description?: string;
  iconStyle?: React.CSSProperties | any;
}

// Simple clean icon style with complete removal of focus indicators
const cleanIconStyle = {
  bg: "transparent",
  border: "none",
  outline: "none",
  _hover: {
    bg: "transparent",
    border: "none",
    "& svg": { color: "#000000" }
  },
  _focus: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  _focusVisible: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  _active: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  transition: "all 0.2s ease-in",
  color: "#cccccc"
};

// Platform-specific icon styles
const platformIconStyles = {
  gmail: {
    color: "#2d3748", // Gmail red
    size: "32px",
    hoverColor: "#C5221F"
  },
  x: {
    color: "#2d3748", // X (formerly Twitter) black
    size: "32px",
    hoverColor: "#333333"
  },
  facebook: {
    color: "#2d3748", // Facebook blue
    size: "32px",
    hoverColor: "#166FE5"
  },
  whatsapp: {
    color: "#2d3748", // WhatsApp green
    size: "32px",
    hoverColor: "#128C7E"
  },
  instagram: {
    color: "#2d3748", // Instagram gradient (simplified to main pink)
    size: "32px",
    hoverColor: "#C13584"
  },
  tiktok: {
    color: "#2d3748", // TikTok black
    size: "32px",
    hoverColor: "#FF0050" // TikTok accent color
  }
};

export function ShareComponent({ 
  title = "Track & Field App", 
  description = "Check out this awesome Track & Field app!",
  iconStyle 
}: ShareComponentProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [copySuccess, setCopySuccess] = useState(false);
  const appUrl = window.location.origin;
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Use provided iconStyle or default to cleanIconStyle
  const finalIconStyle = iconStyle || cleanIconStyle;

  // Clean modal state on close
  const handleClose = () => {
    onClose();
    // Remove any focus from buttons
    setTimeout(() => {
      document.querySelectorAll('button').forEach(button => {
        button.blur();
      });
    }, 100);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopySuccess(true);
      toast({
        title: "Link copied!",
        description: "The app link has been copied to your clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  const shareViaEmail = () => {
    const emailBody = `${description}\n\n${appUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(emailBody)}`;
    handleClose();
  };

  const shareViaX = () => {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(description)}&url=${encodeURIComponent(appUrl)}`, '_blank');
    handleClose();
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(description)}`, '_blank');
    handleClose();
  };

  const shareViaWhatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(description + " " + appUrl)}`, '_blank');
    handleClose();
  };

  const shareViaInstagram = () => {
    // Instagram doesn't have a direct share URL like other platforms
    // We'll copy the link to clipboard and show instructions for sharing on Instagram
    navigator.clipboard.writeText(appUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Link copied to clipboard. Open Instagram and paste in your Story or DM.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    });
    handleClose();
  };

  const shareViaTikTok = () => {
    // TikTok doesn't have a direct sharing API
    // We'll copy the link to clipboard and show instructions for sharing on TikTok
    navigator.clipboard.writeText(appUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Link copied to clipboard. Open TikTok app and paste in your bio or DM.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    });
    handleClose();
  };

  return (
    <>
      <Box position="relative">
        <Tooltip label="Share App" hasArrow>
          <IconButton
            icon={<LuShare size="24px" />}
            aria-label="Share App"
            variant="ghost"
            size="md"
            sx={finalIconStyle}
            onClick={onOpen}
          />
        </Tooltip>
      </Box>

      <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader>Share This App</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Text>Share this Track & Field app with friends and teammates!</Text>
              
              <Flex 
                justify="space-between" 
                mt={4} 
                mb={2}
                px={4}
                width="100%"
                maxW="md"
                mx="auto"
              >
                <IconButton
                  aria-label="Share via Email"
                  icon={<SiGmail size={platformIconStyles.gmail.size} />}
                  variant="unstyled"
                  size="lg"
                  onClick={shareViaEmail}
                  sx={{
                    ...cleanIconStyle,
                    color: platformIconStyles.gmail.color,
                    _hover: {
                      ...cleanIconStyle._hover,
                      "& svg": { color: platformIconStyles.gmail.hoverColor }
                    }
                  }}
                />
                <IconButton
                  aria-label="Share via X"
                  icon={<SiX size={platformIconStyles.x.size} />}
                  variant="unstyled"
                  size="lg"
                  onClick={shareViaX}
                  sx={{
                    ...cleanIconStyle,
                    color: platformIconStyles.x.color,
                    _hover: {
                      ...cleanIconStyle._hover,
                      "& svg": { color: platformIconStyles.x.hoverColor }
                    }
                  }}
                />
                <IconButton
                  aria-label="Share via Facebook"
                  icon={<SiFacebook size={platformIconStyles.facebook.size} />}
                  variant="unstyled"
                  size="lg"
                  onClick={shareViaFacebook}
                  sx={{
                    ...cleanIconStyle,
                    color: platformIconStyles.facebook.color,
                    _hover: {
                      ...cleanIconStyle._hover,
                      "& svg": { color: platformIconStyles.facebook.hoverColor }
                    }
                  }}
                />
                <IconButton
                  aria-label="Share via WhatsApp"
                  icon={<SiWhatsapp size={platformIconStyles.whatsapp.size} />}
                  variant="unstyled"
                  size="lg"
                  onClick={shareViaWhatsapp}
                  sx={{
                    ...cleanIconStyle,
                    color: platformIconStyles.whatsapp.color,
                    _hover: {
                      ...cleanIconStyle._hover,
                      "& svg": { color: platformIconStyles.whatsapp.hoverColor }
                    }
                  }}
                />
                <IconButton
                  aria-label="Share via Instagram"
                  icon={<SiInstagram size={platformIconStyles.instagram.size} />}
                  variant="unstyled"
                  size="lg"
                  onClick={shareViaInstagram}
                  sx={{
                    ...cleanIconStyle,
                    color: platformIconStyles.instagram.color,
                    _hover: {
                      ...cleanIconStyle._hover,
                      "& svg": { color: platformIconStyles.instagram.hoverColor }
                    }
                  }}
                />
                <IconButton
                  aria-label="Share via TikTok"
                  icon={<SiTiktok size={platformIconStyles.tiktok.size} />}
                  variant="unstyled"
                  size="lg"
                  onClick={shareViaTikTok}
                  sx={{
                    ...cleanIconStyle,
                    color: platformIconStyles.tiktok.color,
                    _hover: {
                      ...cleanIconStyle._hover,
                      "& svg": { color: platformIconStyles.tiktok.hoverColor }
                    }
                  }}
                />
              </Flex>
              
              <Divider my={2} />
              
              <Text fontWeight="medium">Or copy the link</Text>
              <Flex>
                <Input 
                  value={appUrl}
                  isReadOnly
                  mr={2}
                />
                <Button 
                  onClick={handleCopyLink}
                  leftIcon={<LinkIcon />}
                  colorScheme={copySuccess ? "green" : "blue"}
                  sx={{
                    "& svg": { color: "white" },
                    _focus: {
                      outline: "none",
                      boxShadow: "none",
                    }
                  }}
                >
                  {copySuccess ? "Copied!" : "Copy"}
                </Button>
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              onClick={handleClose}
              sx={{
                _focus: {
                  outline: "none",
                  boxShadow: "none",
                }
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 