"use client";

import { useEffect, useMemo, useState } from "react";

import { createLocalStorageReaderStorage } from "@/lib/local-storage";
import type { ArticleListPreferences, ArticleReadFilter, ArticleSort } from "@/lib/types";

const defaultPreferences: ArticleListPreferences = {
  sort: "newest",
  readFilter: "all",
  savedOnly: false,
};

export function useArticleListPreferences(isEnabled: boolean) {
  const storage = useMemo(() => createLocalStorageReaderStorage(), []);
  const [preferences, setPreferences] =
    useState<ArticleListPreferences>(defaultPreferences);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    setPreferences(storage.getArticleListPreferences());
  }, [isEnabled, storage]);

  function savePreferences(nextPreferences: ArticleListPreferences) {
    setPreferences(nextPreferences);
    storage.saveArticleListPreferences(nextPreferences);
  }

  function setSort(sort: ArticleSort) {
    savePreferences({ ...preferences, sort });
  }

  function setReadFilter(readFilter: ArticleReadFilter) {
    savePreferences({ ...preferences, readFilter });
  }

  function toggleSavedOnly() {
    savePreferences({ ...preferences, savedOnly: !preferences.savedOnly });
  }

  return {
    preferences,
    setSort,
    setReadFilter,
    toggleSavedOnly,
  };
}
