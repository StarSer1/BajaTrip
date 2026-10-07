import ExperienceCard from './ExperienceCard.jsx';

export default function ExperienceGrid({ experiences, onDetails }) {
  return <div className="grid">{experiences.map((experience) =>
    <ExperienceCard key={experience.id} experience={experience} onDetails={onDetails} />,
  )}</div>;
}
