import React from 'react';
import { IconButton, Tooltip } from '@chakra-ui/react';
import { LuUpload } from 'react-icons/lu';

interface ShareComponentProps {
  title: string;
  description: string;
}

export const ShareComponent: React.FC<ShareComponentProps> = ({ title, description }) => {
  const handleShare = () => {
    console.log('Share functionality would go here', { title, description });
  };

  return (
    <Tooltip label="Share" hasArrow>
      <IconButton
        icon={<LuUpload size="24px" color="#333333" />}
        aria-label="Share App"
        variant="unstyled"
        color="#333333 !important"
        size="md"
        mx="18px"
        p={0}
        minW="auto"
        h="auto"
        onClick={handleShare}
        _hover={{
          color: "black",
        }}
        _focus={{
          boxShadow: "none",
          outline: "none"
        }}
      />
    </Tooltip>
  );
}; 