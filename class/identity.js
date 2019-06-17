// Include Global variables
require("../include/globals");

/**
 * Used Identity for automation
 */
class Identity {

  /**
   * Constructor
   *
   * @param  {string} firstname                 First name
   * @param  {string} lastname                  Last name
   * @param  {Date} birthday                    Birthday
   * @param  {string} email                     Email address
   * @param  {string} password                  password
   * @param  {string} company                   Conpany
   * @param  {string} position="Employee"       Position in company
   * @param  {number} typespeed=456             Average typing speed
   * @param  {number} random=265                Random deviation from average typing speed
   * @param  {number} gender=global.GENDER_MALE Gender
   * @return {Identity}
   */
  constructor(firstname, lastname, birthday, email, password,
    company, position = "Employee", typespeed = 456, random = 265, gender = global.GENDER_MALE) {

    // Set class variables
    this.firstname = firstname;
    this.lastname = lastname;
    this.birthday = birthday;
    this.email = email;
    this.username = email.substr(0, this.email.search("@"));
    this.password = password;
    this.company = company;
    this.position = position;
    this.typespeed = typespeed;
    this.random = random;
    this.gender = gender;
  }

  /**
   * Returns if identity is of male gender
   *
   * @return {boolean}
   */
  isMale() {
    return this.gender == global.GENDER_MALE;
  }

  /**
   * Returns a formatted String of the Identity-Birthday
   *
   * @return {String}  Birthday as a String
   */
  getBirthdayString() {
    let day = this.birthday.getDate();
    let month = (this.birthday.getMonth() + 1);
    if (day < 10)
      day = "0" + day;
    if (month < 10)
      month = "0" + month;

    return "" + day + "." + month + "." + this.birthday.getFullYear();
  }
}

module.exports = Identity;
