import { Box, Flex } from "@mantine/core";

import background from "../assets/Background.jpg";
import logo from "../assets/logo.png";

function AuthLayout({ children }: any) {
  return (
    <Box
      mih="100vh"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <Box
        pos="absolute"
        inset={0}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
      />

      <Box pos="absolute" top={40} left={50}>
        <img
          src={logo}
          alt="StorySign"
          style={{
            width: "220px",
            height: "auto",
          }}
        />
      </Box>

      <Flex
        pos="relative"
        mih="100vh"
        align="center"
        justify="flex-end"
        pr="10%"
      >
        {children}
      </Flex>
    </Box>
  );
}

export default AuthLayout;
