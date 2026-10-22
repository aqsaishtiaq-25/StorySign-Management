import { Modal, Flex, Text, Button } from "@mantine/core";

import { HiOutlineBadgeCheck } from "react-icons/hi";

interface SuccessModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function SuccessModal({ opened, onClose }: SuccessModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      radius={24}
      padding={28}
      size="483px"
      styles={{
        content: {
          backgroundColor: "rgba(255, 235, 188, 1)",
          color: "#2B2B2B",
          height: "300px",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(1px)",
        },
      }}
    >
      <Flex direction="column" align="center" justify="center">
        <Flex
          align="center"
          justify="center"
          style={{
            width: "78px",
            height: "68px",
            borderRadius: "50%",

            marginBottom: "25px",
          }}
        >
          <HiOutlineBadgeCheck size={400} color=" rgba(129, 64, 31, 1)" />
        </Flex>

        <Text
          size="19px"
          fw={700}
          c="#2B2B2B"
          ta="center"
          lh={1.5}
          style={{
            marginBottom: "38px",
          }}
        >
          User have been activated Successfully
        </Text>

        <Button
          w={160}
          h={50}
          radius={8}
          onClick={onClose}
          style={{
            backgroundColor: "rgba(129, 64, 31, 1)",
            color: "rgba(255, 235, 188, 1)",
            fontFamily: "Nunito, sans-serif",
            fontSize: "20px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: "0px",
          }}
        >
          Okay
        </Button>
      </Flex>
    </Modal>
  );
}
