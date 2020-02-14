// ecs.js
// Copyright (C) 2018 Frank Hale <frankhale@gmail.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import _ from "lodash";
import Chance from "chance";

const chance = new Chance();

export function createEntity(name, components = []) {
  let _components = {};

  _.forEach(components, c => {
    for (let prop in c) {
      _components[prop] = c[prop];
    }
  });

  return {
    id: `Entity-${chance.guid()}`,
    name: name,
    components: _components
  };
}

export function getEntity(name, entities) {
  return _.find(entities, { name: name });
}

export function spawnEntity(entities, entityGroupName, name) {
  if (entities && entities[entityGroupName]) {
    let found = _.find(entities[entityGroupName], { name: name });

    if (found) {
      let newEntity = _.cloneDeep(found);
      newEntity.id = `Entity-${chance.guid()}`;
      return newEntity;
    }
  }
}

export function createComponent(name, opts = {}) {
  let component = {};
  component[name] = opts;
  return component;
}

export function getComponent(name, entity) {
  if (entity.components && entity.components[name]) {
    return entity.components[name];
  }
}

export function destroyComponent(name, entity) {
  if (entity.components && entity.components[name]) {
    delete entity.components[name];
  }
}

export function replaceComponent(name, entity, opts) {
  destroyComponent(name, entity);
  createComponent(name, opts);
}

export function getEntitiesWithComponent(name, entities) {
  let results = _.map(entities, entity => {
    if (entity.components && entity.components[name]) {
      return entity;
    }
  });

  return results;
}

export function getEntityWithComponent(componentName, entityName, entities) {
  let entity = getEntity(entityName, entities);
  if (entity) {
    return getComponent(componentName, entity);
  }
}
