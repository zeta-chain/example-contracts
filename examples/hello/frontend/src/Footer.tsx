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
      <a
        className="footer-card"
        href="https://www.zetachain.com/docs/developers/tutorials/intro/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconTutorials />
        <div className="footer-card-text">
          <span className="footer-card-text-title">Build Your Own</span>
          <span className="footer-card-text-subtitle">Tutorials</span>
        </div>
        <IconArrowRotated />
      </a>
      <a
        className="footer-card"
        href="https://zetachain.com/docs/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconDocs />
        <div className="footer-card-text">
          <span className="footer-card-text-title">Documentation</span>
          <span className="footer-card-text-subtitle">Dig in to the docs</span>
        </div>
        <IconArrowRotated />
      </a>
      <a
        className="footer-card"
        href="https://discord.gg/zetachain"
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconDiscuss />
        <div className="footer-card-text">
          <span className="footer-card-text-title">Ask Questions</span>
          <span className="footer-card-text-subtitle">Discuss on Discord</span>
        </div>
        <IconArrowRotated />
      </a>
    </div>
  );
}
