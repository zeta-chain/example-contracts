import './Footer.css';

import {
  IconArrowRotated,
  IconDiscuss,
  IconDocs,
  IconTutorials,
} from './components/icons';

export function Footer() {
  return (
    <div className="footer-container">
      <div className="footer-card">
        <IconTutorials />
        <div className="footer-card-text">
          <span className="footer-card-text-title">Build Your Own</span>
          <span className="footer-card-text-subtitle">Tutorials</span>
        </div>
        <IconArrowRotated />
      </div>
      <div className="footer-card">
        <IconDocs />
        <div className="footer-card-text">
          <span className="footer-card-text-title">Documentation</span>
          <span className="footer-card-text-subtitle">Dig in to the docs</span>
        </div>
        <IconArrowRotated />
      </div>
      <div className="footer-card">
        <IconDiscuss />
        <div className="footer-card-text">
          <span className="footer-card-text-title">Ask Questions</span>
          <span className="footer-card-text-subtitle">Discuss on Discord</span>
        </div>
        <IconArrowRotated />
      </div>
    </div>
  );
}
