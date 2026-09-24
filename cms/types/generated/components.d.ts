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

export interface TicketTextField extends Schema.Component {
  collectionName: 'components_ticket_text_fields';
  info: {
    displayName: 'TextField';
    icon: 'pencil';
    description: 'A line of text drawn on the ticket at the given position (millimeters from the top-left corner). Supports placeholders: {eventName} {eventDate} {venue} {ticketType} {section} {row} {seat} {firstName} {lastName} {email} {orderNumber} {groupName} {ticketNumber} {ticketCount}';
  };
  attributes: {
    text: Attribute.String & Attribute.Required;
    x: Attribute.Float & Attribute.Required;
    y: Attribute.Float & Attribute.Required;
    fontSize: Attribute.Float & Attribute.DefaultTo<12>;
    color: Attribute.String & Attribute.DefaultTo<'#000000'>;
    bold: Attribute.Boolean & Attribute.DefaultTo<false>;
    align: Attribute.Enumeration<['left', 'center', 'right']> &
      Attribute.DefaultTo<'left'>;
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
      'ticket.text-field': TicketTextField;
      'translation.translation-field': TranslationTranslationField;
    }
  }
}
