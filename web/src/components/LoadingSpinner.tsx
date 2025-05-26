import { Flex, Spinner } from '@chakra-ui/react'

export function LoadingSpinner() {
  return (
    <Flex
      height="100vh"
      width="100%"
      alignItems="center"
      justifyContent="center"
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size="xl"
      />
    </Flex>
  )
} 