import React from "react";
import {
  Box,
  Container,
  Link,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaDiscord,
  FaGithub,
  FaLinkedin,
  FaMedium,
  FaTwitter,
} from "react-icons/fa";
import {
  SITE_DESCRIPTION,
  SOCIAL_GITHUB,
  SOCIAL_LINKEDIN,
  SOCIAL_MEDIUM,
  SOCIAL_TWITTER,
  SOCIAL_DISCORD,
} from "../../configuration/Config";
import { NetworkStatus } from "../NetworkStatus";
import { Logo, SocialButton } from "../../Reusables/helper";

interface Props {
  className?: string;
}

export function Footer(props: Props) {
  const className = props.className ?? "";

  return (
    <Box
      className={className}
      bg={useBreakpointValue({ base: "gray.800", md: "gray.900" })}
      color="white"
      py={8}
    >
      <Container maxW="container.xl">
        <Stack
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          spacing={8}
        >
          <Stack spacing={4} align="start">
            <Logo />
            <Text fontSize="sm">{SITE_DESCRIPTION}</Text>
            <NetworkStatus />
          </Stack>

        </Stack>
      </Container>
    </Box>
  );
}
