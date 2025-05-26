import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Heading, 
  HStack, 
  VStack, 
  Text, 
  Progress, 
  SimpleGrid,
  Image,
  Badge,
  Tooltip,
  Spinner,
  Flex
} from '@chakra-ui/react';
import { getAthletePoints, getAthleteLevel, getAthleteBadges } from '../../services/gamificationService';
import { calculateLevel } from '../../config/levels';
import type { AthleteBadge } from '../../types/gamification';

interface GamificationSummaryProps {
  athleteId: string;
  compact?: boolean;
}

interface LevelInfo {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number | null;
  progress: number;
}

export function GamificationSummary({ athleteId, compact = false }: GamificationSummaryProps) {
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState<LevelInfo>({ 
    level: 1, 
    title: "Beginner", 
    currentPoints: 0, 
    nextLevelPoints: 100, 
    progress: 0 
  });
  const [badges, setBadges] = useState<AthleteBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGamificationData() {
      try {
        setLoading(true);
        
        // Load points
        const totalPoints = await getAthletePoints(athleteId);
        setPoints(totalPoints);
        
        // Calculate level
        const levelInfo = calculateLevel(totalPoints);
        setLevel(levelInfo);
        
        // Load badges
        const athleteBadges = await getAthleteBadges(athleteId);
        setBadges(athleteBadges);
      } catch (error) {
        console.error('Error loading gamification data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (athleteId) {
      loadGamificationData();
    }
  }, [athleteId]);

  if (loading) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
        <Spinner size="md" />
      </Box>
    );
  }

  if (compact) {
    // Compact version for small spaces
    return (
      <Box p={4} bg="gray.50" borderRadius="md">
        <HStack spacing={4} justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="sm" color="gray.500">Level {level.level}</Text>
            <Text fontWeight="bold" fontSize="xl">{points} Points</Text>
          </VStack>
          
          <HStack>
            {badges.slice(0, 3).map((badge) => (
              <Tooltip key={badge.badge_id} label={badge.badge?.name || 'Badge'}>
                <Box 
                  width="30px" 
                  height="30px" 
                  borderRadius="full" 
                  overflow="hidden"
                >
                  <Image 
                    src={badge.badge?.icon_url || `/badges/${badge.badge?.code}.svg`} 
                    alt={badge.badge?.name || 'Badge'} 
                    width="100%" 
                    height="100%" 
                    objectFit="cover" 
                  />
                </Box>
              </Tooltip>
            ))}
            {badges.length > 3 && (
              <Badge colorScheme="purple" borderRadius="full" fontSize="xs">
                +{badges.length - 3}
              </Badge>
            )}
          </HStack>
        </HStack>
      </Box>
    );
  }

  return (
    <Box p={4} bg="gray.50" borderRadius="md">
      <VStack align="start" spacing={4}>
        <Heading size="sm" mb={1}>Game Progress</Heading>
        
        <HStack width="100%" justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" fontSize="2xl">{points}</Text>
            <Text fontSize="sm" color="gray.500">Total Points</Text>
          </VStack>
          
          <VStack align="end" spacing={0}>
            <Text fontWeight="bold" fontSize="xl">Level {level.level}</Text>
            <Text fontSize="sm" color="gray.500">
              {level.nextLevelPoints 
                ? `${level.currentPoints} / ${level.nextLevelPoints} to Level ${level.level + 1}`
                : 'Max Level'}
            </Text>
          </VStack>
        </HStack>
        
        <Box width="100%">
          <Progress 
            value={level.progress} 
            colorScheme="green" 
            borderRadius="full" 
            height="8px" 
          />
        </Box>
        
        {badges.length > 0 && (
          <>
            <Heading size="sm" mt={2}>Earned Badges</Heading>
            <SimpleGrid columns={4} spacing={3} width="100%">
              {badges.slice(0, 8).map((badge) => (
                <Tooltip key={badge.badge_id} label={badge.badge?.name || 'Badge'}>
                  <Box 
                    width="50px" 
                    height="50px" 
                    borderRadius="md" 
                    overflow="hidden"
                    boxShadow="sm"
                  >
                    <Image 
                      src={badge.badge?.icon_url || `/badges/${badge.badge?.code}.svg`} 
                      alt={badge.badge?.name || 'Badge'} 
                      width="100%" 
                      height="100%" 
                      objectFit="cover" 
                    />
                  </Box>
                </Tooltip>
              ))}
            </SimpleGrid>
            
            {badges.length > 8 && (
              <Flex justifyContent="center" width="100%">
                <Badge colorScheme="purple" px={2} py={1}>
                  +{badges.length - 8} more badges
                </Badge>
              </Flex>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
} 