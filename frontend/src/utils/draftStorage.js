/**
 * LocalStorage draft management for NAWI Test Report Wizard.
 * Drafts are keyed by reportId (e.g. 'new' or numeric report ID like '1', '2').
 * Keys saved in both `nawi_draft_${reportId}` and `${reportId}` for universal compatibility.
 */

export function getDraftStorageKeys(reportId) {
  const idStr = String(reportId !== undefined && reportId !== null ? reportId : 'new');
  return [
    `nawi_draft_${idStr}`,
    `draft_${idStr}`,
    idStr
  ];
}

/**
 * Load draft from localStorage by reportId.
 * Checks primary and fallback keys.
 */
export function loadDraft(reportId) {
  const keys = getDraftStorageKeys(reportId);
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(`[DraftStorage] Error parsing draft key "${key}":`, err);
    }
  }
  return null;
}

/**
 * Save draft data to localStorage keyed by reportId.
 */
export function saveDraft(reportId, draftData) {
  const idStr = String(reportId !== undefined && reportId !== null ? reportId : 'new');
  const payload = {
    ...draftData,
    reportId: idStr,
    updatedAt: new Date().toISOString()
  };
  const jsonStr = JSON.stringify(payload);

  try {
    // Save to primary namespace
    localStorage.setItem(`nawi_draft_${idStr}`, jsonStr);
    // Also save directly under reportId for direct key lookup
    localStorage.setItem(idStr, jsonStr);
    return true;
  } catch (err) {
    console.warn(`[DraftStorage] Error saving draft for reportId "${idStr}":`, err);
    return false;
  }
}

/**
 * Remove draft from localStorage for a specific reportId.
 */
export function clearDraft(reportId) {
  const keys = getDraftStorageKeys(reportId);
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[DraftStorage] Error clearing draft key "${key}":`, err);
    }
  }
}
