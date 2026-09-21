import { form } from '@ngblocks/form-nodes';

type Company = {
  companyId: number;
  companyName: string;
};

const defaultCompany: Company = {
  companyId: 23,
  companyName: 'Apple',
};

const myForm = form({
  name: '',
  age: null,
  siblings: 2,
  birthday: new Date('1990-06-15T00:00:00.000Z'),
  sister: undefined,
  address: {
    city: 'Zurich',
  },
  inlineCompany: {
    companyId: 7,
    companyName: 'Google',
  },
  company: defaultCompany,
  roles: ['admin'],
  recentCompanies: [defaultCompany],
});

myForm.name(); // string
myForm.age(); // unknown
myForm.siblings(); // number
myForm.birthday(); // Date
myForm.sister(); // unknown
myForm.address.city(); // string
myForm.company.companyId(); // number
myForm.roles(); // string[]
myForm.recentCompanies(); // Company[]
myForm.roles.nodeType() === 'field'; // true
myForm.recentCompanies.nodeType() === 'field'; // true
