import type { Schema, Attribute } from '@strapi/strapi';

export interface ContactFormFormField extends Schema.Component {
  collectionName: 'components_contact_form_form_fields';
  info: {
    displayName: 'FormField';
    icon: 'align-left';
    description: '';
  };
  attributes: {
    label: Attribute.String;
    required: Attribute.Boolean & Attribute.DefaultTo<false>;
    fieldName: Attribute.String;
    type: Attribute.Enumeration<['text', 'email', 'number', 'checkbox']>;
    description: Attribute.Text;
  };
}

export interface GlobalSponsor extends Schema.Component {
  collectionName: 'components_global_sponsors';
  info: {
    displayName: 'Sponsor';
  };
  attributes: {
    logo: Attribute.Media;
    url: Attribute.String;
    name: Attribute.String;
  };
}

export interface TranslationTranslationField extends Schema.Component {
  collectionName: 'components_translation_translation_fields';
  info: {
    displayName: 'TranslationField';
    icon: 'globe-europe';
  };
  attributes: {
    key: Attribute.String;
    value: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'contact-form.form-field': ContactFormFormField;
      'global.sponsor': GlobalSponsor;
      'translation.translation-field': TranslationTranslationField;
    }
  }
}
