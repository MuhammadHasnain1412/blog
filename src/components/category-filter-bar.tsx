"use client";

import { useEffect, useState } from "react";
import { Group, Text } from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";

type CategorySummary = {
  name: string;
  slug: string;
};

type Props = {
  categories: CategorySummary[];
};

/**
 * Renders in-page category filters that hide/show sections client-side
 * on the home page. When clicked on other pages, it navigates to the home page
 * and filters.
 */
export default function CategoryFilterBar({ categories }: Props) {
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const pathname = usePathname();
  const router = useRouter();

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

  useEffect(() => {
    if (pathname === "/") {
      const pending = sessionStorage.getItem("pendingCategoryFilter");
      if (pending) {
        sessionStorage.removeItem("pendingCategoryFilter");
        setTimeout(() => scrollToSlug(pending), 100);
      } else {
        syncSections(activeSlug);
      }
    } else {
      setActiveSlug("");
    }
  }, [pathname]);

  const handleSelect = (slug: string) => {
    if (pathname === "/") {
      scrollToSlug(slug);
    } else {
      sessionStorage.setItem("pendingCategoryFilter", slug);
      router.push("/");
    }
  };

  if (categories.length === 0) return null;

  return (
    <Group gap="xl" h={50} justify="center" wrap="nowrap">
      <Text
        fw={700}
        size="sm"
        tt="uppercase"
        style={{
          whiteSpace: "nowrap",
          cursor: "pointer",
          color: activeSlug === "all" ? "#000" : "#888",
        }}
        onClick={() => handleSelect("all")}
        className="hover-dark"
      >
        HOME
      </Text>
      {categories.map((category) => (
        <Text
          key={category.slug}
          fw={700}
          size="sm"
          tt="uppercase"
          style={{
            whiteSpace: "nowrap",
            cursor: "pointer",
            color: activeSlug === category.slug ? "#000" : "#888",
          }}
          onClick={() => handleSelect(category.slug)}
          className="hover-dark"
        >
          {category.name}
        </Text>
      ))}
    </Group>
  );
}
