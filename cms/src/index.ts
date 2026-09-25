// Content types whose relations should display a meaningful field instead of the
// numeric id. Strapi only auto-selects the first `string` attribute as a display
// field, so types that only have `uid` fields (or no display field at all) fall
// back to showing ids in relation dropdowns.
const MAIN_FIELDS: Record<string, { mainField: string; defaultSortBy?: string }> = {
  'api::group.group': { mainField: 'name', defaultSortBy: 'name' },
  'api::item-type.item-type': { mainField: 'slug', defaultSortBy: 'slug' },
  'api::giftcard.giftcard': { mainField: 'code', defaultSortBy: 'code' },
  // Orders keep their creation order; a uuid is a poor sort key.
  'api::order.order': { mainField: 'uid', defaultSortBy: 'id' },
};

const applyContentManagerDisplayFields = async (strapi: any) => {
  const contentManager = strapi.plugin('content-manager');
  if (!contentManager) return;

  const contentTypesService = contentManager.service('content-types');
  const contentTypes = Object.values(strapi.contentTypes).filter(
    (contentType: any) =>
      typeof contentType?.uid === 'string' && contentType.uid.startsWith('api::')
  ) as any[];

  for (const contentType of contentTypes) {
    const configuration = await contentTypesService.findConfiguration(contentType);
    const settings = { ...(configuration.settings ?? {}) };
    const metadatas = { ...(configuration.metadatas ?? {}) };
    let changed = false;

    // The field used to display this content type's own entries.
    const own = MAIN_FIELDS[contentType.uid];
    if (own) {
      if (settings.mainField !== own.mainField) {
        settings.mainField = own.mainField;
        changed = true;
      }
      if (own.defaultSortBy && settings.defaultSortBy !== own.defaultSortBy) {
        settings.defaultSortBy = own.defaultSortBy;
        changed = true;
      }
    }

    // The field used to display each related entry in a relation input.
    for (const [attributeName, attribute] of Object.entries(contentType.attributes ?? {})) {
      const relation = attribute as any;
      if (relation?.type !== 'relation') continue;

      const targetMainField = MAIN_FIELDS[relation.target as string]?.mainField;
      if (!targetMainField) continue;

      const metadata = metadatas[attributeName];
      if (!metadata?.edit || metadata.edit.mainField === targetMainField) continue;

      metadatas[attributeName] = {
        ...metadata,
        edit: { ...metadata.edit, mainField: targetMainField },
      };
      changed = true;
    }

    if (!changed) continue;

    await contentTypesService.updateConfiguration(contentType, {
      settings,
      metadatas,
      layouts: configuration.layouts,
    });
    strapi.log.info(`[content-manager] Set display fields for ${contentType.uid}`);
  }
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    try {
      await applyContentManagerDisplayFields(strapi);
    } catch (error) {
      strapi.log.error(`[content-manager] Failed to set display fields: ${error}`);
    }
  },
};