# Copyright (C) 2021 Guyutongxue
#
# This file is part of devcpp7.
#
# devcpp7 is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# devcpp7 is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with devcpp7.  If not, see <http://www.gnu.org/licenses/>.

$WITH_MINGW = $false;
$WITH_CLANGD = $true;

$GENERATE_ANON_WS = $true;

$MINGW_VERSION = "11.1.0";
$CLANGD_VERSION = "12.0.0";

$DEFAULT_COMPILE_FLAGS = @(
  "-xc++",
  "--target=x86_64-pc-windows-gnu",
  "-std=c++2a",
  "-g"
);

# parse argv
foreach ($arg in $args) {
  if ($arg -eq "--mingw") {
    $WITH_MINGW = $true;
  }
  if ($arg -eq "--no-mingw") {
    $WITH_MINGW = $false;
  }
  if ($arg -eq "--clangd") {
    $WITH_CLANGD = $true;
  }
  if ($arg -eq "--no-clangd") {
    $WITH_CLANGD = $false;
  }
  if ($arg -eq "--anon-ws") {
    $GENERATE_ANON_WS = $true;
  }
  if ($arg -eq "--no-anon-ws") {
    $GENERATE_ANON_WS = $false;
  }
}

Import-Module BitsTransfer;

if ($WITH_MINGW) {
  Start-BitsTransfer -Source "https://github.com/Guyutongxue/mingw-release/releases/download/v$MINGW_VERSION/gytx_x86_64-$MINGW_VERSION-posix-seh.7z" -Destination "mingw.7z";
}
if ($WITH_CLANGD) {
  Start-BitsTransfer -Source "https://github.com/clangd/clangd/releases/download/$CLANGD_VERSION/clangd-windows-$CLANGD_VERSION.zip" -Destination "clangd.zip";
}
if ($GENERATE_ANON_WS) {
  Remove-Item -Path "anon_workspace" -Recurse;
  New-Item -Path "anon_workspace" -ItemType Directory | Out-Null;
  New-Item -Path "anon_workspace/compile_flags.txt" | Out-Null;
  $DEFAULT_COMPILE_FLAGS -join "`r`n" | Out-File "anon_workspace/compile_flags.txt";
}
