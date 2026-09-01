import { field, form } from '../../src/public-api';

const deepForm = form({
  level01: {
    level02: {
      level03: {
        level04: {
          level05: {
            level06: {
              level07: {
                level08: {
                  level09: {
                    level10: {
                      level11: {
                        level12: {
                          level13: {
                            level14: {
                              level15: {
                                value: '',
                                explicit: field(1),
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

deepForm.level01.level02.level03.level04.level05.level06.level07.level08.level09.level10.level11.level12.level13.level14.level15.value.set('complete');
deepForm.level01.level02.level03.level04.level05.level06.level07.level08.level09.level10.level11.level12.level13.level14.level15.explicit.set(2);

const wideForm = form({
  field01: '',
  field02: 2,
  field03: false,
  field04: new Date(),
  field05: null,
  field06: undefined,
  field07: '',
  field08: 8,
  field09: true,
  field10: field('explicit'),
  field11: '',
  field12: 12,
  field13: false,
  field14: new Date(),
  field15: null,
  field16: undefined,
  field17: '',
  field18: 18,
  field19: true,
  field20: field('explicit'),
  field21: '',
  field22: 22,
  field23: false,
  field24: new Date(),
  field25: null,
  field26: undefined,
  field27: '',
  field28: 28,
  field29: true,
  field30: field('explicit'),
  field31: '',
  field32: 32,
  field33: false,
  field34: new Date(),
  field35: null,
  field36: undefined,
  field37: '',
  field38: 38,
  field39: true,
  field40: field('explicit'),
  group01: { value: '', enabled: false },
  group02: { value: '', enabled: false },
  group03: { value: '', enabled: false },
  group04: { value: '', enabled: false },
  group05: { value: '', enabled: false },
  group06: { value: '', enabled: false },
  group07: { value: '', enabled: false },
  group08: { value: '', enabled: false },
  group09: { value: '', enabled: false },
  group10: { value: '', enabled: false },
});

wideForm.field01.set('updated');
wideForm.field40.set('updated');
wideForm.group01.value.set('updated');
wideForm.group10.enabled.set(true);

void [deepForm, wideForm];
