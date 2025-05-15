import React from 'react';
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

const agents = [
  {
    icon: '🧠',
    title: 'Professor Agent',
    description: [
      'Creates fundamental knowledge base in Google Docs',
      'Organizes content with proper headings and sections',
      'Includes detailed explanations and examples',
    ],
    output: 'Comprehensive knowledge base document with table of contents',
  },
  {
    icon: '🗺️',
    title: 'Academic Advisor Agent',
    description: [
      'Designs learning path in a structured Google Doc',
      'Creates progressive milestone markers',
      'Includes time estimates and prerequisites',
    ],
    output: 'Visual roadmap document with clear progression paths',
  },
  {
    icon: '📚',
    title: 'Research Librarian Agent',
    description: [
      'Compiles resources in an organized Google Doc',
      'Includes links to academic papers and tutorials',
      'Adds descriptions and difficulty levels',
    ],
    output: 'Categorized resource list with quality ratings',
  },
  {
    icon: '✍️',
    title: 'Teaching Assistant Agent',
    description: [
      'Develops exercises in an interactive Google Doc',
      'Creates structured practice sections',
      'Includes solution guides',
    ],
    output: 'Complete practice workbook with answers',
  },
];

const AITeachingAgents = () => {
  return (
    <>
      <BaseHeader />

      <div className="container py-4">
        <h2 className="mb-4 text-center">🧑‍🏫 AI Teaching Team</h2>
        <div className="row">
          {agents.map((agent, index) => (
            <div key={index} className="col-md-6 mb-4">
              <div className="card h-100 shadow rounded-3 p-3">
                <h4 className="mb-3">
                  <span className="me-2">{agent.icon}</span> {agent.title}
                </h4>
                <ul className="mb-2">
                  {agent.description.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <div className="mt-2">
                  <strong>Output:</strong> <em>{agent.output}</em>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BaseFooter />
    </>
  );
};

export default AITeachingAgents;
