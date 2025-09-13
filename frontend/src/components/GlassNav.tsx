import React from 'react';

const GlassNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(241,242,245,0.9)] backdrop-blur-md shadow-xl rounded-full m-4 p-2">
      <div className="flex justify-between items-center">
        <div>
          <a href="/" className="text-xl font-bold">blabout</a>
        </div>
        <div>
          <a href="/workflows" className="mx-2">Workflows</a>
          <a href="/agents" className="mx-2">Agents</a>
          <a href="/documents" className="mx-2">Documents</a>
        </div>
        <div>
          <a href="/login" className="mx-2">Login</a>
          <a href="/signup" className="mx-2">Signup</a>
        </div>
      </div>
    </nav>
  );
};

export default GlassNav;