import * as electron from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execFile, spawn } from 'child_process';
import { getWindow, extraResourcesPath } from '../basicUtil'


function encode(src: string) {
  return '$' + encodeURIComponent(src);
}

function isSameName(a: string, b:string) {
  if (a[0] === '$' && b[0] === '$') return a === b;
  if (a[0] === '$') return encode(b) === a;
  if (b[0] === '$') return encode(a) === b;
  return a === b;
}

function changeExt(srcPath: string, ext: string) {
  return path.join(path.dirname(srcPath), path.parse(srcPath).name + ext);
}

function getExecutablePath(srcPath: string) {
  return path.join(path.dirname(srcPath), encode(path.parse(srcPath).name) + ".exe");
}

function isCompiled(srcPath: string): boolean {
  const exePath = getExecutablePath(srcPath);
  if (fs.existsSync(exePath)) {
    return fs.statSync(exePath).mtime > fs.statSync(srcPath).mtime;
  } else
    return false;
}

async function execCompiler(srcPath: string, noLink: boolean = true): Promise<{ success: boolean, stderr: string, [key: string]: any}> {
  let outputFileName: string;
  const cwd = path.dirname(srcPath);
  let args: string[];
  if (noLink) {
    outputFileName = path.basename(changeExt(srcPath, '.o'));
    args = [
      '-c',
      srcPath,
      '-o',
      outputFileName,
      '-fdiagnostics-format=json',
    ]
  } else {
    outputFileName = path.basename(getExecutablePath(srcPath));
    args = [
      srcPath,
      '-o',
      outputFileName,
    ]
  }
  return new Promise((resolve, reject) => {
    execFile(path.join(extraResourcesPath, 'mingw64/bin/g++.exe'), args, {
      cwd: cwd,
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          error,
          stdout,
          stderr
        });
      } else {
        resolve({
          success: true,
          stderr
        });
      }
    });
  });
}

interface BuildResult { success: boolean, stage?: "compile" | "link", diagnostics: any[], linkerr?: string }

async function doCompile(srcPath: string): Promise<BuildResult> {
  // 
  // generate .o
  const compileResult = await execCompiler(srcPath);
  console.log(compileResult);
  const diagnostics: any[] = JSON.parse(compileResult.stderr);
  if (!compileResult.success) {
    return {
      success: false,
      stage: "compile",
      diagnostics: diagnostics
    };
  }
  // generate .exe
  const linkResult = await execCompiler(changeExt(srcPath, '.o'), false);
  if (!linkResult.success) {
    return {
      success: false,
      stage: "link",
      linkerr: linkResult.stderr,
      diagnostics: diagnostics
    };
  } else {
    // remove .o
    fs.unlinkSync(changeExt(srcPath, '.o'));
    return {
      success: true,
      linkerr: linkResult.stderr,
      diagnostics: diagnostics
    };
  }
}

export async function build(event: electron.IpcMainEvent, arg: { path: string }) {
  const result = await doCompile(arg.path);
  getWindow().webContents.send('ng:buildControl/compiled', result);
}

export async function runExe(event: electron.IpcMainEvent, arg: { path: string }) {
  console.log(arg.path);
  if (!isCompiled(arg.path)) {
    const result = await doCompile(arg.path);
    getWindow().webContents.send('ng:buildControl/compiled', result);
    if (!result.success) return;
  }
  const cmdPath = process.env['ComSpec'];
  spawn(cmdPath, [
    '/C',
    path.join(extraResourcesPath, 'bin/ConsolePauser.exe'),
    getExecutablePath(arg.path)
  ], {
    detached: true
  });
}