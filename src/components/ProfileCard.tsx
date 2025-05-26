import React from 'react';
import {
  Box, Avatar, Heading, Text, Card, CardBody, CardHeader, CardFooter, Divider, Flex, SimpleGrid, VStack, HStack, Button, IconButton
} from '@chakra-ui/react';
import { FaCamera, FaEdit } from 'react-icons/fa';

interface ProfileCardProps {
  avatarUrl?: string;
  bannerColor?: string;
  name: string;
  role: string;
  stats?: { label: string; value: number | string }[];
  bio?: string;
  infoList?: { label: string; value: string | number | undefined | null }[];
  onEdit?: () => void;
  onAction?: () => void;
  onAvatarEdit?: () => void;
  editLabel?: string;
  actionLabel?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  avatarUrl,
  bannerColor = '#4A90E2',
  name,
  role,
  stats = [],
  bio,
  infoList = [],
  onEdit,
  onAction,
  onAvatarEdit,
  editLabel = 'Edit Profile',
  actionLabel = 'View Stats',
}) => {
  return (
    <Card boxShadow="lg" borderRadius="2xl" overflow="visible" p={0} position="relative" mb={12} minH="520px">
      {/* Edit Icon Button (top right) */}
      {onEdit && (
        <IconButton
          aria-label="Edit profile"
          icon={<FaEdit />}
          position="absolute"
          top={3}
          right={3}
          zIndex={2}
          size="sm"
          variant="ghost"
          colorScheme="blue"
          onClick={onEdit}
        />
      )}
      {/* Banner */}
      <Box position="relative" h="140px" bg={bannerColor} overflow="visible">
        {/* Overlapping Avatar with camera icon */}
        <Box position="absolute" left="50%" bottom={-12} transform="translateX(-50%)" zIndex={1}>
          <Avatar
            size="2xl"
            src={avatarUrl}
            name={name}
            border="6px solid white"
            bg="gray.100"
            boxShadow="lg"
          />
          {onAvatarEdit && (
            <IconButton
              aria-label="Change photo"
              icon={<FaCamera color="#1976d2" />}
              size="sm"
              position="absolute"
              bottom={2}
              right={2}
              borderRadius="full"
              colorScheme="blue"
              bg="white"
              boxShadow="md"
              border="2px solid #1976d2"
              onClick={onAvatarEdit}
              zIndex={2}
            />
          )}
        </Box>
      </Box>
      <CardBody pt={16} pb={20} px={6} overflow="visible">
        <VStack spacing={2} align="center">
          <Heading size="lg">{name}</Heading>
          <Text color="gray.500" fontSize="lg" fontWeight="medium">{role}</Text>
          {/* Stats Row */}
          {stats.length > 0 && (
            <SimpleGrid columns={stats.length} spacing={6} w="100%" mt={4} mb={2}>
              {stats.map((stat) => (
                <Box key={stat.label} textAlign="center">
                  <Text fontWeight="bold" fontSize="2xl">{stat.value}</Text>
                  <Text color="gray.500" fontSize="sm">{stat.label}</Text>
                </Box>
              ))}
            </SimpleGrid>
          )}
          {/* Bio/Description */}
          {bio && (
            <Text color="gray.700" fontSize="md" textAlign="center" mt={2}>
              {bio}
            </Text>
          )}
          {/* Info List */}
          {infoList.length > 0 && (
            <VStack align="start" spacing={1} mt={4} w="100%">
              {infoList.map((item) => (
                <Text key={item.label}><b>{item.label}:</b> {item.value || '-'}</Text>
              ))}
            </VStack>
          )}
        </VStack>
      </CardBody>
      {/* Custom Footer for Action Buttons */}
      {(onEdit || onAction) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 72,
            paddingBottom: 24,
            marginTop: -24,
            background: 'transparent',
            zIndex: 1,
            position: 'relative',
          }}
        >
          <HStack spacing={4}>
            {onEdit && (
              <Button colorScheme="blue" borderRadius="full" px={8} size="lg" onClick={onEdit}>
                {editLabel}
              </Button>
            )}
            {onAction && (
              <Button variant="outline" borderRadius="full" px={8} size="lg" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
          </HStack>
        </div>
      )}
    </Card>
  );
};

export default ProfileCard; 