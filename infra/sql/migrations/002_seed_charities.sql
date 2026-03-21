insert into charities (name, slug, category, country_code, mission, verified)
values
  ('Child Education Fund', 'child-education-fund', 'Education', 'IN', 'Scholarships and school infrastructure for underserved communities.', true),
  ('Clean Water Alliance', 'clean-water-alliance', 'Water', 'IN', 'Safe drinking water access in rural districts.', true),
  ('Cancer Care Initiative', 'cancer-care-initiative', 'Healthcare', 'IN', 'Early screening and treatment access for low-income families.', true)
on conflict (slug) do nothing;
