import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker'; 
import { setupDatabase, dbService, Tarefa } from './data/database';

export default function App() {
  const [banco, setBanco] = useState<SQLite.SQLiteDatabase | null>(null);
  const [tarefa, setTarefa] = useState<string>('');
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [listaTarefa, setListaTarefas] = useState<Tarefa[]>([]);
  

  const [imagemPreviewEdicao, setImagemPreviewEdicao] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const db = await setupDatabase();
      setBanco(db);
      carregarTarefas(db);
    }
    init();
  }, []);

  async function carregarTarefas(db: SQLite.SQLiteDatabase) {
    const dados = await dbService.getAll(db);
    setListaTarefas(dados);
  }

  
  async function salvarTarefa() {
    if (tarefa.trim() === '' || !banco) return;

    if (idEditando) {
      
      const tarefaAtual = listaTarefa.find(t => t.id === idEditando);
      await dbService.update(banco, idEditando, tarefa, tarefaAtual?.imagem || null);
      setIdEditando(null);
    } else {
      
      await dbService.create(banco, tarefa, null);
    }

    setTarefa('');
    setImagemPreviewEdicao(null);
    carregarTarefas(banco);
  }

  async function removerTarefa(id: number) {
    if (!banco) return;
    Alert.alert("Excluir Tarefa", "Deseja remover esta tarefa e sua foto?", [
      { text: "Cancelar" },
      { text: "Sim", onPress: async () => {
          await dbService.delete(banco, id);
          carregarTarefas(banco);
        } 
      }
    ]);
  }

  function prepararEdicao(item: Tarefa) {
    setTarefa(item.nome);
    setIdEditando(item.id);
    setImagemPreviewEdicao(item.imagem || null);
  }

 
  async function atualizarFotoDaTarefa(idTarefa: number, novaImagem: string | null) {
    if (!banco) return;
    const tarefaAtual = listaTarefa.find(t => t.id === idTarefa);
    if (!tarefaAtual) return;
    
  
    await dbService.update(banco, idTarefa, tarefaAtual.nome, novaImagem);
    carregarTarefas(banco);
  }

  async function tirarFoto(idTarefa: number) {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Atenção", "Precisamos de permissão para usar a câmera.");
      return;
    }
    
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true, 
      aspect: [4, 3],
      quality: 0.5, 
    });

    if (!resultado.canceled) {
      await atualizarFotoDaTarefa(idTarefa, resultado.assets[0].uri);
    }
  }

  async function abrirGaleria(idTarefa: number) {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!resultado.canceled) {
      await atualizarFotoDaTarefa(idTarefa, resultado.assets[0].uri);
    }
  }
  
  async function removerFotoTarefa(idTarefa: number) {
    Alert.alert("Excluir Foto", "Deseja remover a foto desta tarefa?", [
      { text: "Cancelar" },
      { text: "Sim", onPress: async () => {
          await atualizarFotoDaTarefa(idTarefa, null);
        } 
      }
    ]);
  }


  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Gerenciador de Tarefas</Text>

      {idEditando && imagemPreviewEdicao && (
          <Image source={{ uri: imagemPreviewEdicao }} style={styles.previewImagemEdicao} />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="O que precisa ser feito?"
          value={tarefa}
          onChangeText={setTarefa}
        />
        <TouchableOpacity style={[styles.botao, idEditando ? {backgroundColor: '#FFA500'} : {}]} onPress={salvarTarefa}>
          <Text style={styles.textoBotao}>{idEditando ? "OK" : "Salvar"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listaTarefa}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cardTarefa}>
            <View style={styles.conteudoTarefa}>
              
              
              {item.imagem && (
                <Image source={{ uri: item.imagem }} style={styles.imagemLista} />
              )}
              
              <View style={{flex: 1}}>
                  <Text style={styles.textoTarefa}>{item.nome}</Text>
                  
                  
                  <View style={styles.containerBotoesFotoTarefa}>
                    {!item.imagem ? (
                      <Text style={styles.textoSemFoto}>Sem foto</Text>
                    ) : (
                      <TouchableOpacity style={styles.botaoAcaoFotoTarefa} onPress={() => removerFotoTarefa(item.id)}>
                        <Text style={styles.textoBotaoAcaoFotoTarefa}>❌ Remover Foto</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.botaoAcaoFotoTarefa} onPress={() => tirarFoto(item.id)}>
                        <Text style={styles.textoBotaoAcaoFotoTarefa}>📷 Câmera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.botaoAcaoFotoTarefa} onPress={() => abrirGaleria(item.id)}>
                        <Text style={styles.textoBotaoAcaoFotoTarefa}>🖼️ Galeria</Text>
                    </TouchableOpacity>
                  </View>
              </View>
            </View>
            
           
            <View style={styles.acoes}>
              <TouchableOpacity onPress={() => prepararEdicao(item)}>
                <Text style={{color: 'blue', marginRight: 15}}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removerTarefa(item.id)}>
                <Text style={{color: 'red'}}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 60, paddingHorizontal: 20 },
  titulo: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a', textAlign: 'center' },
  inputContainer: { flexDirection: 'row', marginBottom: 25 },
  input: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#dcdcdc', borderRadius: 10, padding: 12, fontSize: 16 },
  botao: { backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 10, marginLeft: 10 },
  textoBotao: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  previewImagemEdicao: { width: 100, height: 100, borderRadius: 8, marginBottom: 15, alignSelf: 'center' },
  
  cardTarefa: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#4CAF50', elevation: 3, flexDirection: 'column' },
  conteudoTarefa: { flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: 15 },
  imagemLista: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  textoTarefa: { fontSize: 18, color: '#333', flexShrink: 1, fontWeight: 'bold' },
  
  containerBotoesFotoTarefa: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' },
  botaoAcaoFotoTarefa: { backgroundColor: '#e0e0e0', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 5 },
  textoBotaoAcaoFotoTarefa: { color: '#333', fontSize: 12, fontWeight: 'bold' },
  textoSemFoto: { color: '#999', fontSize: 12, fontStyle: 'italic' },

  acoes: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }
});