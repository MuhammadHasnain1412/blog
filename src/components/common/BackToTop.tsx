"use client";

import { useEffect, useState } from "react";
import { ActionIcon, Transition } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Transition transition="slide-up" mounted={visible}>
      {(styles) => (
        <ActionIcon
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          variant="filled"
          color="dark"
          size="xl"
          radius="xl"
          style={{
            ...styles,
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 200,
          }}
          aria-label="Back to top"
        >
          <IconArrowUp size={20} />
        </ActionIcon>
      )}
    </Transition>
  );
}
