# Resource directory contact audit

Generated 2026-08-27 from `tests/referral-resources.sample.json`, a snapshot of the
207 live records. Produced by `src/utils/contactQuality.ts`, which is what the
portal now runs on every row.

## Cannot be contacted at all: 18

These are blocking. A person sent to one of these has no way to make contact.

**Correctional Health Treatment Centers, Inc.** (SPA 1)
- No phone number. Somebody sent here has no way to make contact.

**Elmira Recuperative Care** (SPA 1)
- No phone number. Somebody sent here has no way to make contact.

**CSJJ Services Inc DBA Homewatch Caregivers?** (SPA 2)
- No phone number. Somebody sent here has no way to make contact.

**Everytable, PBC** (SPA unknown)
- No phone number. Somebody sent here has no way to make contact.

**Master-Care, Inc.** (SPA 1)
- "916-33-7768" has 9 digits. A US number has ten. This cannot be dialled.

**Cambrian Homecare** (SPA 8)
- No phone number. Somebody sent here has no way to make contact.

**Something More Inc. Costa Mesa** (SPA 6)
- "Kristi Hels" contains no phone number.

**San Fernando Valley Community Mental Health Center** (SPA 2)
- The phone field holds an email address rather than a number: "ranglin@sfvcmhc.org". Nobody can call this.

**Golden Years/Nexus Healthcare Management Inc** (SPA 3)
- "Gayane Bislamyan" contains no phone number.

**Glen Park Senior Living** (SPA 2)
- No phone number. Somebody sent here has no way to make contact.

**Information and Referral Federation of Los Angeles County (DBA 211 LA)** (SPA 1)
- The phone field holds an email address rather than a number: "dmolina@211la.org". Nobody can call this.

**Gracelight Community Health** (SPA 7)
- No phone number. Somebody sent here has no way to make contact.

**Margins Health** (SPA 8)
- No phone number. Somebody sent here has no way to make contact.

**PREP ED PROGRAMS INC. Lakewood** (SPA 7)
- No phone number. Somebody sent here has no way to make contact.

**Family Promise of the South Bay** (SPA 6)
- "Jocelyn Delarosa" contains no phone number.

**Salida Del Sol CBAS** (SPA 3)
- The phone field holds an email address rather than a number: "ecm@serenityecm.com". Nobody can call this.

**Donnessto Home Care LLC DBA Firstlight Home Care of Santa Clarita?** (SPA 2)
- No phone number. Somebody sent here has no way to make contact.

**Partners for Justice** (SPA 8)
- No phone number. Somebody sent here has no way to make contact.

## Reachable but the phone field needs tidying: 22

Not blocking. A caseworker can still call, but the field holds more than a number.

**Vital Plus Home Health dba Access TLC Home Health Care Ventura County**
- 2 numbers in one field: (805) 206-1590, (805) 517-1620. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Penny Lane Centers**
- 2 numbers in one field: (323) 318-9960, (323) 216-9880. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Rosarium Health**
- An email address is in the phone field. It belongs in Contact Email.
- A person's name is in the phone field. It belongs in Contact Person Name.

**Urban Social Services and Advocacy**
- 3 numbers in one field: (562) 346-6889, (415) 906-0847, (916) 226-0262. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Service Center for Independent Life (SCIL)**
- 2 numbers in one field: (951) 892-5885, (909) 621-6722. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Uncle Dave's Housing**
- 2 numbers in one field: (424) 652-1191, (310) 597-0666. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Tarra Hill**
- 2 numbers in one field: (951) 901-8105, (323) 345-4322. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Access TLC Home Health**
- A person's name is in the phone field. It belongs in Contact Person Name.

**The Center In Hollywood**
- 2 numbers in one field: (323) 943-0868, (323) 378-3225. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Heritage Group Homes, Inc.  Corporate Office**
- 2 numbers in one field: (909) 559-8222, (626) 653-1000. A caseworker does not know which to ring. Record the intake line and move the rest to notes.
- A person's name is in the phone field. It belongs in Contact Person Name.

**ModifyHealth**
- 2 numbers in one field: (818) 430-9256, (908) 918-4380. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Heritage Clinic and the Community Assistance Program for Seniors**
- 4 numbers in one field: (213) 382-4400, (562) 264-6001, (661) 575-9365, (626) 577-8480. A caseworker does not know which to ring. Record the intake line and move the rest to notes.
- A person's name is in the phone field. It belongs in Contact Person Name.

**Bartz-Altadonna Community Health Center**
- 2 numbers in one field: (619) 493-7788, (661) 874-4050. A caseworker does not know which to ring. Record the intake line and move the rest to notes.
- A person's name is in the phone field. It belongs in Contact Person Name.

**Affordable Living for the Aging (ALA)**
- 3 numbers in one field: (323) 229-7716, (323) 606-7657, (323) 650-7988. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Independent Living Systems, LLC**
- 2 numbers in one field: (818) 356-1598, (888) 262-1292. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Soteria Home Health Agency, Inc.**
- 2 numbers in one field: (310) 387-5513, (310) 672-6200. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Heritage Health Network**
- 2 numbers in one field: (866) 744-1231, (714) 908-5600. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Five Acres**
- 2 numbers in one field: (800) 696-6793, (626) 993-3113. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Exodus Recovery**
- 2 numbers in one field: (424) 356-4918, (424) 384-6140. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**The Children's Clinic TCC**
- 2 numbers in one field: (562) 618-5751, (562) 264-4663. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

**Encompass Housing**
- 2 numbers in one field: (714) 472-9586, (714) 552-4472. A caseworker does not know which to ring. Record the intake line and move the rest to notes.
- A person's name is in the phone field. It belongs in Contact Person Name.

**St. John's Community Health**
- 2 numbers in one field: (213) 449-1538, (213) 713-1042. A caseworker does not know which to ring. Record the intake line and move the rest to notes.

