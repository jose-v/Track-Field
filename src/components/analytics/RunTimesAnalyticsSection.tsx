import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Text,
  Button,
  ButtonGroup,
  Select,
  useColorModeValue,
  SimpleGrid,
  Badge,
  Icon,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Heading
} from '@chakra-ui/react';
import { FaChartArea, FaTable, FaRunning } from 'react-icons/fa';
import { RunTimesChart } from './RunTimesChart';
import { RunTimesTable } from './RunTimesTable';
import { RunTimesRepsAnalysis } from './RunTimesRepsAnalysis';

interface RunTimesAnalyticsSectionProps {
  analytics: any;
  dateRange: string;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

export const RunTimesAnalyticsSection: React.FC<RunTimesAnalyticsSectionProps> = ({
  analytics,
  dateRange,
  selectedDate,
  setSelectedDate
}) => {
  const [runTimesViewMode, setRunTimesViewMode] = useState<'chart' | 'table' | 'reps'>('chart');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const buttonTextColor = useColorModeValue('gray.600', 'gray.300');
  const buttonBorderColor = useColorModeValue('gray.300', 'gray.600');
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Safety check for analytics data
  if (!analytics || !analytics.runTimes) {
    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack>
              <Heading size="md">Run Times</Heading>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody px={{ base: 0, md: 6 }} py={{ base: 4, md: 6 }}>
          <Text textAlign="center" color="gray.500" py={8}>
            No run times data available for the selected period.
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg} borderColor={borderColor}>
      <CardHeader>
        <HStack justify="space-between">
          <HStack>
            <Heading size="md">Run Times</Heading>
          </HStack>
          <ButtonGroup isAttached size="sm">
            <Button 
              colorScheme={runTimesViewMode === 'chart' ? 'blue' : 'gray'}
              variant={runTimesViewMode === 'chart' ? 'solid' : 'outline'}
              onClick={() => setRunTimesViewMode('chart')}
              leftIcon={<FaChartArea />}
              fontWeight={runTimesViewMode === 'chart' ? 'bold' : 'normal'}
              bg={runTimesViewMode === 'chart' ? 'blue.500' : 'transparent'}
              color={runTimesViewMode === 'chart' ? 'white' : buttonTextColor}
              borderColor={runTimesViewMode === 'chart' ? 'blue.500' : buttonBorderColor}
              _hover={{
                bg: runTimesViewMode === 'chart' ? 'blue.600' : buttonHoverBg
              }}
            >
              Chart
            </Button>
            <Button 
              colorScheme={runTimesViewMode === 'table' ? 'blue' : 'gray'}
              variant={runTimesViewMode === 'table' ? 'solid' : 'outline'}
              onClick={() => setRunTimesViewMode('table')}
              leftIcon={<FaTable />}
              fontWeight={runTimesViewMode === 'table' ? 'bold' : 'normal'}
              bg={runTimesViewMode === 'table' ? 'blue.500' : 'transparent'}
              color={runTimesViewMode === 'table' ? 'white' : buttonTextColor}
              borderColor={runTimesViewMode === 'table' ? 'blue.500' : buttonBorderColor}
              _hover={{
                bg: runTimesViewMode === 'table' ? 'blue.600' : buttonHoverBg
              }}
            >
              Table
            </Button>
            <Button 
              colorScheme={runTimesViewMode === 'reps' ? 'blue' : 'gray'}
              variant={runTimesViewMode === 'reps' ? 'solid' : 'outline'}
              onClick={() => setRunTimesViewMode('reps')}
              leftIcon={<FaRunning />}
              fontWeight={runTimesViewMode === 'reps' ? 'bold' : 'normal'}
              bg={runTimesViewMode === 'reps' ? 'blue.500' : 'transparent'}
              color={runTimesViewMode === 'reps' ? 'white' : buttonTextColor}
              borderColor={runTimesViewMode === 'reps' ? 'blue.500' : buttonBorderColor}
              _hover={{
                bg: runTimesViewMode === 'reps' ? 'blue.600' : buttonHoverBg
              }}
            >
              Reps
            </Button>
          </ButtonGroup>
        </HStack>
      </CardHeader>
      <CardBody px={{ base: 0, md: 6 }} py={{ base: 4, md: 6 }}>
        {/* Always render all components to maintain hook order */}
        <Box display={runTimesViewMode === 'chart' ? 'block' : 'none'}>
          <RunTimesChart 
            analytics={analytics}
            dateRange={dateRange}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </Box>
        <Box display={runTimesViewMode === 'table' ? 'block' : 'none'}>
          <RunTimesTable 
            analytics={analytics}
            dateRange={dateRange}
          />
        </Box>
        <Box display={runTimesViewMode === 'reps' ? 'block' : 'none'}>
          <RunTimesRepsAnalysis 
            analytics={analytics}
            dateRange={dateRange}
          />
        </Box>
      </CardBody>
    </Card>
  );
}; 