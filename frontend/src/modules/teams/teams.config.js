const MAX_MEMBERS = 10;

export const teamsConfig = {
  resource: "teams",
  fields: [
    { name: "team_name", label: "Team Name" },
    { name: "team_lead", label: "Team Lead" },
    ...Array.from({ length: MAX_MEMBERS }, (_, index) => ({ name: `tmember_${index + 1}`, label: `Member ${index + 1}` }))
  ]
};
