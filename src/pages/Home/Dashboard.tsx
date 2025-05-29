import { Button, Text, VStack, Box, HStack, Icon } from '@chakra-ui/react';
import { FaRobot, FaCalendarAlt, FaBed, FaRunning } from 'react-icons/fa';
import { useChatbotContext } from '../../components/ChatBot/ChatbotProvider';

const Dashboard = () => {
  const { openChatbot } = useChatbotContext();

  // Common questions to provide as suggestions
  const quickQuestions = [
    {
      text: "When is my next meet?",
      icon: FaCalendarAlt,
      color: "blue.500"
    },
    {
      text: "How much did I sleep last week?",
      icon: FaBed,
      color: "purple.500"
    },
    {
      text: "How is my 100m time improving?",
      icon: FaRunning,
      color: "green.500"
    }
  ];

  return (
    <VStack spacing={8} align="stretch" w="100%" maxW="1200px" mx="auto" p={4}>
      {/* Existing dashboard content */}
      
      {/* AI Assistant Section */}
      <Box 
        w="100%" 
        bg="white" 
        borderRadius="xl" 
        overflow="hidden"
        borderWidth="1px"
      >
        <VStack align="start" spacing={4}>
          <HStack>
            <Icon as={FaRobot} color="blue.500" boxSize={6} />
            <Text fontSize="xl" fontWeight="bold">AI Track Assistant</Text>
          </HStack>
          
          <Text>
            Ask me anything about your training, schedule, or performance metrics.
          </Text>
          
          <HStack spacing={4} wrap="wrap">
            {quickQuestions.map((question, index) => (
              <Button 
                key={index}
                leftIcon={<Icon as={question.icon} />}
                colorScheme={question.color.split('.')[0]}
                variant="outline"
                onClick={() => openChatbot(question.text)}
                mb={2}
              >
                {question.text}
              </Button>
            ))}
          </HStack>
        </VStack>
      </Box>
      
      {/* Other dashboard sections */}
    </VStack>
  );
};

export default Dashboard; 