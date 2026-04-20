export type CustomerAccountCategory =
  | 'retail'
  | 'contractor'
  | 'interior_designer'
  | 'architect'
  | 'quantity_surveyor';

export const customerAccountCategoryOptions: Array<{
  id: CustomerAccountCategory;
  label: string;
  shortLabel: string;
  description: string;
  memberAccess: boolean;
}> = [
  {
    id: 'retail',
    label: 'Retail Client',
    shortLabel: 'Retail',
    description: 'Standard shopping, quotes, orders, saved designs, and customer portal access.',
    memberAccess: false,
  },
  {
    id: 'contractor',
    label: 'Contractor',
    shortLabel: 'Contractor',
    description: 'Project tools, quote packs, BOQ/tender access, and contractor workflow support.',
    memberAccess: true,
  },
  {
    id: 'interior_designer',
    label: 'Interior Designer',
    shortLabel: 'Designer',
    description: 'Studio tools, visual concepts, product faces, moodboards, and tender design scopes.',
    memberAccess: true,
  },
  {
    id: 'architect',
    label: 'Architect',
    shortLabel: 'Architect',
    description: 'Drawing analysis, specification support, member studio tools, and tender access.',
    memberAccess: true,
  },
  {
    id: 'quantity_surveyor',
    label: 'Quantity Surveyor',
    shortLabel: 'QS',
    description: 'QS calculator, BOQ review, quote pack preparation, and tender quantity scopes.',
    memberAccess: true,
  },
];

export const memberCustomerAccountCategories = customerAccountCategoryOptions
  .filter((category) => category.memberAccess)
  .map((category) => category.id);

export function getCustomerAccountCategoryLabel(category: CustomerAccountCategory | null | undefined) {
  return customerAccountCategoryOptions.find((option) => option.id === category)?.label ?? 'Guest';
}

export function getCustomerAccountCategoryShortLabel(category: CustomerAccountCategory | null | undefined) {
  return customerAccountCategoryOptions.find((option) => option.id === category)?.shortLabel ?? 'Guest';
}

export function hasMemberCustomerAccess(category: CustomerAccountCategory | null | undefined) {
  return Boolean(category && memberCustomerAccountCategories.includes(category));
}
