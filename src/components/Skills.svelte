<dev class="skills">
  <div id="progressBar" class="CTATSkillWindow" data-ctat-initial="true"></div>
</dev>

<script>
  CTATExampleTracerSkill.prototype.clone = function() {
    let clone = new CTATExampleTracerSkill(this.getCategory(), this.getName(), this.getPGuess(), this.getPKnown(),
                                          this.getPSlip(), this.getPLearn(), this.getHistory(), this.getOpportunityCount())
    clone.setLabel(this.getLabel())
    clone.setDescription(this.getDescription())
    return clone
  }

  document.addEventListener('tutorInitialized', addSkillListener)

  function addSkillListener() {
    let initialSkills = [], previousSkills = [], currentSkills = null
    CTATCommShell.commShell.addGlobalEventListener({
      processCommShellEvent(event, message) {
        if (event == 'StartProblem') {
          currentSkills = CTAT.ToolTutor.tutor.getProblemSummary().getSkills()
          if (currentSkills) {
            initialSkills = currentSkills.getAllSkills().map((skill) => skill.clone())
            previousSkills = currentSkills.getAllSkills().map((skill) => skill.clone())
            setInitialSkills(initialSkills)
          }
        } else if (currentSkills && event == 'AssociatedRules' && message) {
          setInitialSkills(initialSkills)
          let skillUpdates = message.getSkillsObject().getSkillSet(),
              skillLabelElements = document.getElementsByClassName('CTATSkillWindow--label')
          if (skillUpdates.length) {
            previousSkills.forEach(skill => {
              let skillUpdate = skillUpdates.find(skillUpdate =>
                    `${skillUpdate.getSkillName()} ${skillUpdate.getCategory()}` == skill.getSkillName()),
                  skillLabelElement = Array.prototype.find.call(skillLabelElements, skillLabelElement =>
                    skillLabelElement.innerHTML == skill.getLabel())
              if (skillUpdate) {
                let skillBarElement = skillLabelElement.previousSibling.firstElementChild
                skillBarElement.style.width = skill.getPKnown() * 100 + '%'
                window.setTimeout(() => {
                  skillBarElement.classList.add('transition')
                  skillBarElement.style.width = skillUpdate.getLevel() * 100 + '%'
                }, 0)
              } else
                skillLabelElement.parentNode.classList.add('blur')
            })
            window.setTimeout(() => {
              Array.prototype.forEach.call(skillLabelElements, skillLabelElement => {
                skillLabelElement.previousSibling.firstElementChild.classList.remove('transition')
                skillLabelElement.parentNode.classList.remove('blur')
              })
            }, 1000)
            previousSkills = currentSkills.getAllSkills().map((skill) => skill.clone())
          }
        }
      }
    })
  }

  function setInitialSkills(skills) {
    let skillElementLabels = document.getElementsByClassName('CTATSkillWindow--label')
    skills.forEach(skill => {
      let label = skill.getLabel(),
          initialSkillElement = document.createElement('div')
      initialSkillElement.classList.add('CTATSkillWindow--initial')
      initialSkillElement.style.width = skill.getPKnown() * 100 + '%'
      Array.prototype.find.call(skillElementLabels, labelElement => labelElement.innerHTML == label).
        previousSibling.append(initialSkillElement)
    })
  }
</script>

<style>
  .skills {
    grid-area: skills;
  }
  .CTATSkillWindow {
    margin: 20px 10px;
    border: none;
    height: auto;
    padding: 0px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: center;
    background-color: inherit;
    font-size: 12px;
  }
  :global(.CTATSkillWindow--skill) {
    height: 18px;
  }
  :global(.CTATSkillWindow--bar) {
    border-radius: 9px;
    width: 100%;
    height: 18px;
    overflow: hidden;
    background-color: white;
  }
  :global(.CTATSkillWindow--label) {
    position: relative;
    top: -18px;
    margin-left: 4px;
    height: 18px;
    line-height: 18px;
    text-align: left;
    white-space: nowrap;
  }
  :global(.CTATSkillWindow--initial) {
    position: relative;
    top: -18px;
    border-right: 1px solid black;
    height: inherit;
    background-color: transparent;
  }
  :global(.CTATSkillWindow--bar--nonmastered) {
    height: 100%;
    background: gold;
  }
  :global(.CTATSkillWindow--bar--mastery) {
    height: 100%;
    background: limegreen;
  }
  :global(.transition) {
    transition: width 1s ease-in-out;
  }
  :global(.blur) {
    filter: brightness(0.8);
  }
</style>
