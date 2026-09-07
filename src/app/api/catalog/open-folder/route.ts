import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    const dataFolder = path.join(process.cwd(), 'data');
    console.log('API Request received to open folder:', dataFolder);
    
    // Using powershell Invoke-Item is the most robust way in Windows
    const { exec } = require('child_process');
    exec(`powershell.exe -Command "Invoke-Item '${dataFolder}'"`, (error: any, stdout: any, stderr: any) => {
      if (error) console.error('Exec error:', error);
      if (stderr) console.error('Exec stderr:', stderr);
      console.log('Opened folder successfully.');
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to open folder' }, { status: 500 });
  }
}
