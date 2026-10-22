import {
  Modal,
  Flex,
  Text,
  Textarea,
  Group,
  Button,
  ActionIcon,
} from "@mantine/core";

import { IoCloseOutline } from "react-icons/io5";

interface SuspendModalProps {
  opened: boolean;
  onClose: () => void;
  reason: string;
  setReason: (value: string) => void;
  onConfirm: () => void;
}

export default function SuspendModal({
  opened,
  onClose,
  reason,
  setReason,
  onConfirm,
}: SuspendModalProps) {
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
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(1px)",
        },
      }}
    >
      <Flex justify="space-between" align="center" mb={12}>
        <Text size="22px" fw={700} c="#2B2B2B">
          Suspend User
        </Text>

        <ActionIcon
          onClick={onClose}
          variant="subtle"
          radius="xl"
          size={36}
          style={{
            border: "1.5px solid #2B2B2B",
            color: "#2B2B2B",
          }}
        >
          <IoCloseOutline size={22} />
        </ActionIcon>
      </Flex>

      <Text size="14.6px" c="#141212" lh={1.6} mb={18}>
        Are you sure you want to Suspend this user? The user will permanently
        lose access to their account but can be reactivated later.
      </Text>

      <Text size="17px" fw={610} c="#2B2B2B" mb={8}>
        Reason:
      </Text>

      <Textarea
        placeholder="Write reason here...."
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value)}
        minRows={4}
        radius={14}
        styles={{
          input: {
            backgroundColor: "rgba(255, 235, 188, 1)",
            border: "1px solid rgba(188, 188, 188, 1)",
            color: "#080808",
            fontSize: "13px",
            height: "120px",
          },
        }}
        mb={24}
      />

      <Group gap={14} grow>
        <Button
          radius={10}
          h={42}
          style={{
            backgroundColor: "#7B3C11",
            color: "rgba(255, 235, 188, 1)",
            fontSize: "14px",
            fontWeight: 600,
          }}
          onClick={onConfirm}
        >
          Suspend
        </Button>

        <Button
          radius={10}
          h={42}
          style={{
            backgroundColor: "#2B2B2B",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 600,
          }}
          onClick={onClose}
        >
          Cancel
        </Button>
      </Group>
    </Modal>
  );
}
