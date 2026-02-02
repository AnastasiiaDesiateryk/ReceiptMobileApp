export const tagUtils = {
  addTag(tags, newTag) {
    if (!newTag || tags.includes(newTag)) return tags;
    return [...tags, newTag];
  },
  removeTag(tags, tagToRemove) {
    return tags.filter(t => t !== tagToRemove);
  },
  validateTag(tag) {
    if (!tag) return false;
    return /^[a-zA-Z0-9-_ ]{1,20}$/.test(tag);
  },
};
