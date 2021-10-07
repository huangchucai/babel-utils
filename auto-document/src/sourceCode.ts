/**
 * say 你好
 * @param name 名字
 * @param age 年龄
 * @param life 活着
 */
function sayHi (name: string, age: number, life: boolean) {
  console.log(`hi, ${name}`);
  return `hi, ${name}`;
}

/**
 * 类测试
 */
class Guang {
  name: string; // name 属性
  constructor(name: string) {
    this.name = name;
  }

  /**
   * 方法测试
   */
  sayHi (): string {
    return `hi, I'm ${this.name}`;
  }
}
