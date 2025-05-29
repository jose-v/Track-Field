import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react';

export const Feature = ({ icon, title, text, ...rest }: any) => {
  return (
    <Box p={5} rounded="md" {...rest}>
      {icon}
      <Heading size="md" mb={2}>{title}</Heading>
      <Text color="gray.600">{text}</Text>
    </Box>
  );
};

export default Feature;
