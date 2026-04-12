"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Group, Text } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";

type CategorySummary = {
  name: string;
  slug: string;
};

type Props = {
  categories: CategorySummary[];
};

/**
 * Renders crawlable category links.
 * On the home page, clicks are intercepted to filter in-page sections instead
 * of navigating away.
 */
export default function CategoryFilterBar({ categories }: Props) {
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const pathname = usePathname();

  const syncSections = (slug: string) => {
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-category-section]",
    );
    sections.forEach((section) => {
      const { categorySection } = section.dataset;
      if (!categorySection) return;
      const hidden = slug !== "all" && categorySection !== slug ? "none" : "";
      section.style.display = hidden;
    });
  };

  const scrollToSlug = (slug: string) => {
    setActiveSlug(slug);
    // ✅ Update the DOM synchronously before we trigger a scroll action
    // Otherwise elements might be display:none during scroll computation, or their removal will cause the document to jump.
    syncSections(slug);

    setTimeout(() => {
      if (slug === "all") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const target = document.querySelector<HTMLElement>(
        `[data-category-section='${slug}']`,
      );
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  useEffect(() => {
    if (pathname === "/") {
      syncSections(activeSlug);
    }
  }, [activeSlug, pathname]);

  const handleSelect = (
    slug: string,
    event: MouseEvent<HTMLAnchorElement>,
  ) => {
    if (pathname !== "/") {
      return;
    }

    event.preventDefault();
    scrollToSlug(slug);
  };

  if (categories.length === 0) return null;

  return (
    <Group gap="xl" h={50} justify="center" wrap="nowrap">
      <Link
        href="/"
        onClick={(event) => handleSelect("all", event)}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Text
          component="span"
          fw={700}
          size="sm"
          tt="uppercase"
          style={{
            whiteSpace: "nowrap",
            cursor: "pointer",
            color:
              pathname === "/" && activeSlug === "all"
                ? "#000"
                : pathname === "/"
                  ? "#888"
                  : "#000",
          }}
          className="hover-dark"
        >
          HOME
        </Text>
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/${category.slug}`}
          onClick={(event) => handleSelect(category.slug, event)}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Text
            component="span"
            fw={700}
            size="sm"
            tt="uppercase"
            style={{
              whiteSpace: "nowrap",
              cursor: "pointer",
              color:
                pathname === "/"
                  ? activeSlug === category.slug
                    ? "#000"
                    : "#888"
                  : pathname === `/${category.slug}`
                    ? "#000"
                    : "#888",
            }}
            className="hover-dark"
          >
            {category.name}
          </Text>
        </Link>
      ))}
    </Group>
  );
}
