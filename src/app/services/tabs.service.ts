import { Injectable } from '@angular/core';
import { editor } from 'monaco-editor';
import * as path from 'path';
import { EditorService } from './editor.service'

export interface Tab {
  key: string, // An unique udid for each tab
  type: "file" | "devcpp",
  title: string,
  code: string,
  path: string,
  saved: boolean
}

interface Enumerate<T> {
  index: number;
  value: T;
}
const nullEnum : Enumerate<any> = {
  index: null,
  value: null
};

interface TabOptions {
  key: string,
  type: "file" | "devcpp",
  title: string,
  code?: string,
  path?: string
}

@Injectable({
  providedIn: 'root'
})
export class TabsService {
  tabList: Tab[] = [{
    key: "aaa",
    type: "file",
    title: "a.cpp",
    code: "int main() {}",
    path: null,
    saved: false
  },{
    key: "bbb",
    type: "file",
    title: "b.cpp",
    code: "#include <cstdio>\nint main() { ; ; ; }",
    path: null,
    saved: false
  }];

  private activeTabKey: string = "bbb";

  constructor(private editorService: EditorService) {
    // TabsService controls how EditorService works.
    // When EditorService is not initialized, TabsService should do noting.
    // So I add `if (!this.editorService.isInit) return;` in each function
    // that use EditorService.
    // When initialization finished, it will send a event. TabsService will
    // do necessary initialization by calling `getActive` then.
    editorService.eventEmitter.subscribe((v: string) => {
      console.log("editorService event: ", v);
      this.getActive();
    })
  }

  syncActiveCode() {
    if (!this.editorService.isInit) return;
    if (this.getActive().value === null) return;
    this.getActive().value.code = this.editorService.getCode();
  }

  getActive(): Enumerate<Tab> {
    if (this.activeTabKey === null) return nullEnum;
    return this.getByKey(this.activeTabKey)
  }

  getByKey(key: string): Enumerate<Tab> {
    const index = this.tabList.findIndex((x: Tab) => x.key === key);
    if (typeof index === "undefined") return nullEnum;
    return {
      index,
      value: this.tabList[index]
    }
  }

  changeActive(key?: string): void;
  changeActive(index: number): void;
  changeActive(arg: any) {
    if (!this.editorService.isInit) return;
    if (typeof arg === "undefined") {
      this.editorService.switchToModel(this.getActive().value);
      return;
    }
    this.syncActiveCode();
    if (typeof arg === "string")
      this.activeTabKey = arg;
    else if (typeof arg === "number")
      this.activeTabKey = this.tabList[arg].key;
      this.editorService.switchToModel(this.getActive().value);
  }

  add(options: TabOptions) {
    const newTab: Tab = {
      key: options.key,
      type: options.type,
      title: options.title,
      code: options.code ?? "",
      saved: options.path ? true : false,
      path: options.path ?? null
    };
    this.tabList.push(newTab);
  }

  removeAt(index: number) {
    const target = this.tabList[index];
    if (target.saved === false) {
      // [TODO]
    }
    this.tabList.splice(index, 1);
    // closing current tab
    if (this.activeTabKey === target.key) {
      if (this.tabList.length === 0) {
        // The only tab in MainView
        this.activeTabKey = null;
      } else if (index === this.tabList.length) {
        // The last tab, move to front
        this.activeTabKey = this.tabList[index - 1].key;
      } else {
        // Stay on current index (next tab)
        this.activeTabKey = this.tabList[index].key;
      }
    }
  }

  updateCode(key: string, newCode: string) {
    const target = this.getByKey(key).value;
    target.code = newCode;
    target.saved = false;
  }

  saveCode(key: string, savePath: string) {
    if (!this.editorService.isInit) return;
    const target = this.getByKey(key).value;
    const oldPath = target.path;
    target.saved = true;
    target.path = savePath;
    target.title = path.basename(savePath);
    this.editorService.switchToModel(target, savePath !== oldPath);
  }
}